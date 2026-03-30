"""
Action Service Module
====================

Handles execution of voice-activated actions like timers, stopwatches, and alarms.
This service parses natural language commands and executes the corresponding actions.

CAPABILITIES:
- Timer management: start, cancel, check status
- Stopwatch management: start, stop, check status  
- Alarm management: create, check status
- Natural language parsing for time expressions

USAGE:
    from app.services.action_service import ActionService
    
    action_service = ActionService()
    result = await action_service.execute_command("set a timer for 5 minutes")
"""

import re
import asyncio
import logging
import uuid
import time
import platform
import subprocess
from typing import Dict, Optional, Tuple, Any
from datetime import datetime, timedelta
from app.models import TimerCreateRequest, AlarmCreateRequest

# Platform-specific imports
if platform.system() == "Windows":
    try:
        import winsound
        HAS_WINSOUND = True
    except ImportError:
        HAS_WINSOUND = False
else:
    HAS_WINSOUND = False

logger = logging.getLogger(__name__)

class ActionService:
    """
    Service for executing voice-activated actions.
    
    This service parses natural language commands and executes the corresponding
    actions directly using the timer, stopwatch, and alarm functionality.
    """
    
    def __init__(self):
        # Direct access to timer/alarm/stopwatch state
        self.timers: Dict[str, dict] = {}
        self.timer_tasks: Dict[str, asyncio.Task] = {}
        self.stopwatches: Dict[str, dict] = {}
        self.alarms: Dict[str, dict] = {}
        self.alarm_tasks: Dict[str, asyncio.Task] = {}
        
    async def _play_notification_sound(self):
        """Play a notification sound when timer/alarm completes."""
        try:
            if HAS_WINSOUND:
                # Play system notification sound on Windows
                winsound.MessageBeep(winsound.MB_ICONEXCLAMATION)
                # Play multiple beeps for better notification
                await asyncio.sleep(0.2)
                winsound.MessageBeep(winsound.MB_ICONEXCLAMATION)
                await asyncio.sleep(0.2)
                winsound.MessageBeep(winsound.MB_ICONEXCLAMATION)
            else:
                # For other systems, we could use a different method
                logger.info("[NOTIFICATION] Timer/Alarm completed!")
        except Exception as e:
            logger.error(f"[NOTIFICATION] Could not play sound: {e}")
    
    async def _play_alarm_sound(self):
        """Play alarm sound (repeated beeps) and set Windows OS alarm."""
        try:
            if HAS_WINSOUND:
                # Play 5 beeps for alarm
                for _ in range(5):
                    winsound.MessageBeep(winsound.MB_ICONEXCLAMATION)
                    await asyncio.sleep(0.3)
                
                # Try to set Windows OS alarm notification
                try:
                    # Create a Windows notification with alarm sound
                    powershell_cmd = '''
                    Add-Type -AssemblyName System.Windows.Forms
                    $notification = New-Object System.Windows.Forms.NotifyIcon
                    $notification.Icon = [System.Drawing.SystemIcons]::Information
                    $notification.BalloonTipTitle = "J.A.R.V.I.S Alarm"
                    $notification.BalloonTipText = "Your alarm is ringing!"
                    $notification.BalloonTipIcon = "Info"
                    $notification.Visible = $true
                    $notification.ShowBalloonTip(10000)
                    Start-Sleep -Seconds 10
                    $notification.Dispose()
                    '''
                    
                    # Run PowerShell command in background
                    if platform.system() == "Windows":
                        import sys
                        if hasattr(subprocess, 'CREATE_NEW_CONSOLE'):
                            subprocess.Popen(['powershell', '-Command', powershell_cmd], 
                                           creationflags=subprocess.CREATE_NEW_CONSOLE)
                        else:
                            subprocess.Popen(['powershell', '-Command', powershell_cmd])
                    else:
                        subprocess.Popen(['powershell', '-Command', powershell_cmd])
                    
                except Exception as ps_error:
                    logger.error(f"[ALARM] PowerShell notification failed: {ps_error}")
                
            else:
                logger.info("[ALARM] Alarm triggered!")
        except Exception as e:
            logger.error(f"[ALARM] Could not play alarm sound: {e}")
        
    def parse_timer_command(self, text: str) -> Optional[Tuple[int, str]]:
        """
        Parse timer commands like:
        - "set a timer for 5 minutes"
        - "timer 30 seconds"
        - "start a 2 hour timer"
        - "10 minute timer"
        
        Returns: (seconds, label) or None if not a timer command
        """
        timer_patterns = [
            r'(?:set\s+)?(?:a\s+)?timer\s+(?:for\s+)?(\d+)\s+(minute|minutes|second|seconds|hour|hours)s?',
            r'(?:start\s+)?(?:a\s+)?(\d+)\s+(minute|minutes|second|seconds|hour|hours)\s+timer',
            r'timer\s+(\d+)\s+(minute|minutes|second|seconds|hour|hours)',
        ]
        
        for pattern in timer_patterns:
            match = re.search(pattern, text.lower())
            if match:
                amount = int(match.group(1))
                unit = match.group(2)
                
                # Convert to seconds
                if unit.startswith('second'):
                    seconds = amount
                elif unit.startswith('minute'):
                    seconds = amount * 60
                elif unit.startswith('hour'):
                    seconds = amount * 3600
                else:
                    continue
                
                # Extract label if any
                label_match = re.search(r'timer\s+(?:for\s+)?(?:\d+\s+\w+s?)\s*(.+?)(?:\s+(?:please|now|$))', text.lower())
                label = label_match.group(1).strip() if label_match else f"{amount} {unit} timer"
                
                return seconds, label
        
        return None
    
    def parse_stopwatch_command(self, text: str) -> Optional[str]:
        """
        Parse stopwatch commands like:
        - "start stopwatch"
        - "stop stopwatch"
        - "stop the stopwatch"
        
        Returns: "start" or "stop" or None if not a stopwatch command
        """
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['start stopwatch', 'start the stopwatch']):
            return 'start'
        elif any(word in text_lower for word in ['stop stopwatch', 'stop the stopwatch']):
            return 'stop'
        
        return None
    
    def parse_alarm_command(self, text: str) -> Optional[Tuple[str, str]]:
        """
        Parse alarm commands like:
        - "set alarm for 8:30 AM"
        - "alarm at 2:30 PM"
        - "wake me up at 7 AM"
        - "set an alarm for tomorrow 9 AM"
        
        Returns: (datetime_iso, label) or None if not an alarm command
        """
        alarm_patterns = [
            r'(?:set\s+)?(?:an\s+)?alarm\s+(?:for\s+)?(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))',
            r'(?:set\s+)?alarm\s+(?:at\s+)?(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))',
            r'wake\s+me\s+up\s+(?:at\s+)?(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))',
        ]
        
        for pattern in alarm_patterns:
            match = re.search(pattern, text.lower())
            if match:
                time_str = match.group(1).upper()
                
                # Parse time
                try:
                    # Handle AM/PM
                    if 'AM' in time_str and '12' in time_str.split(':')[0]:
                        time_str = time_str.replace('12:', '00:')
                    elif 'PM' in time_str and '12' not in time_str.split(':')[0]:
                        hour = int(time_str.split(':')[0])
                        time_str = time_str.replace(str(hour), str(hour + 12), 1)
                    
                    # Create datetime for today
                    now = datetime.now()
                    time_part = datetime.strptime(time_str, '%I:%M %p').time()
                    alarm_dt = datetime.combine(now.date(), time_part)
                    
                    # If time is in the past, set for tomorrow
                    if alarm_dt <= now:
                        alarm_dt += timedelta(days=1)
                    
                    # Extract label if any
                    label_match = re.search(r'alarm\s+(?:for\s+)?(?:\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))\s*(.+?)(?:\s+(?:please|now|$))', text.lower())
                    label = label_match.group(1).strip() if label_match else f"Alarm at {time_str}"
                    
                    return alarm_dt.isoformat(), label
                    
                except ValueError:
                    continue
        
        return None
    
    async def execute_command(self, command: str) -> Dict[str, Any]:
        """
        Execute a voice command and return the result.
        
        Args:
            command: Natural language command
            
        Returns:
            Dict with action result: {action: str, result: dict, message: str}
        """
        command_lower = command.lower()
        
        # Try timer commands
        timer_result = self.parse_timer_command(command)
        if timer_result:
            seconds, label = timer_result
            return await self._execute_timer_action(seconds, label)
        
        # Try stopwatch commands
        stopwatch_action = self.parse_stopwatch_command(command)
        if stopwatch_action:
            return await self._execute_stopwatch_action(stopwatch_action)
        
        # Try alarm commands
        alarm_result = self.parse_alarm_command(command)
        if alarm_result:
            datetime_iso, label = alarm_result
            return await self._execute_alarm_action(datetime_iso, label)
        
        return {
            "action": "none",
            "result": {},
            "message": "I didn't recognize a timer, stopwatch, or alarm command."
        }
    
    async def _execute_timer_action(self, seconds: int, label: str) -> Dict[str, Any]:
        """Execute timer action directly."""
        try:
            timer_id = str(uuid.uuid4())
            now = time.time()
            ends_at = now + seconds
            
            self.timers[timer_id] = {
                "id": timer_id,
                "label": label,
                "seconds": seconds,
                "started_at": now,
                "ends_at": ends_at,
                "status": "running",
            }

            async def _timer_worker(tid: str, duration: int):
                try:
                    await asyncio.sleep(duration)
                    entry = self.timers.get(tid)
                    if entry and entry.get("status") == "running":
                        entry["status"] = "finished"
                        logger.info("[TIMER] Timer %s finished (%s)", tid, entry.get("label") or "")
                        # Play notification sound
                        await self._play_notification_sound()
                except asyncio.CancelledError:
                    logger.info("[TIMER] Timer %s cancelled", tid)

            task = asyncio.create_task(_timer_worker(timer_id, seconds))
            self.timer_tasks[timer_id] = task

            return {
                "action": "timer_started",
                "result": {
                    "id": timer_id,
                    "label": label,
                    "seconds": seconds,
                    "remaining_seconds": seconds,
                    "status": "running",
                    "started_at": now,
                    "ends_at": ends_at,
                },
                "message": f"Timer started for {seconds} seconds ({label}). Timer ID: {timer_id[:8]}..."
            }
        except Exception as e:
            logger.error(f"Timer action error: {e}")
            return {
                "action": "error",
                "result": {},
                "message": f"Error starting timer: {str(e)}"
            }
    
    async def _execute_stopwatch_action(self, action: str) -> Dict[str, Any]:
        """Execute stopwatch action directly."""
        try:
            if action == 'start':
                sw_id = str(uuid.uuid4())
                now = time.time()
                self.stopwatches[sw_id] = {
                    "id": sw_id,
                    "label": None,
                    "started_at": now,
                    "elapsed": 0.0,
                    "running": True,
                }
                return {
                    "action": "stopwatch_started",
                    "result": {
                        "id": sw_id,
                        "label": None,
                        "running": True,
                        "started_at": now,
                        "elapsed_seconds": 0.0,
                    },
                    "message": f"Stopwatch started. ID: {sw_id[:8]}..."
                }
            elif action == 'stop':
                # Find a running stopwatch and stop it
                for sw_id, entry in self.stopwatches.items():
                    if entry.get("running"):
                        now = time.time()
                        entry["elapsed"] += now - entry["started_at"]
                        entry["running"] = False
                        return {
                            "action": "stopwatch_stopped",
                            "result": {
                                "id": sw_id,
                                "label": entry.get("label"),
                                "running": False,
                                "started_at": entry["started_at"],
                                "elapsed_seconds": float(entry["elapsed"]),
                            },
                            "message": f"Stopwatch stopped. Elapsed: {entry['elapsed']:.2f} seconds"
                        }
                return {
                    "action": "error",
                    "result": {},
                    "message": "No running stopwatch found"
                }
        except Exception as e:
            logger.error(f"Stopwatch action error: {e}")
            return {
                "action": "error",
                "result": {},
                "message": f"Error with stopwatch: {str(e)}"
            }
    
    async def _execute_alarm_action(self, datetime_iso: str, label: str) -> Dict[str, Any]:
        """Execute alarm action directly."""
        try:
            dt = datetime.fromisoformat(datetime_iso)
            now = datetime.now()
            
            # If time is for today and has passed, set for tomorrow
            if dt.date() == now.date() and dt.time() <= now.time():
                dt = dt + timedelta(days=1)
            
            # If somehow still in the past, add a day
            if dt <= now:
                dt = dt + timedelta(days=1)

            delta = (dt - now).total_seconds()
            alarm_id = str(uuid.uuid4())
            self.alarms[alarm_id] = {
                "id": alarm_id,
                "label": label,
                "scheduled_at": dt.timestamp(),
                "status": "scheduled",
            }

            async def _alarm_worker(aid: str, delay: float):
                try:
                    await asyncio.sleep(delay)
                    entry = self.alarms.get(aid)
                    if entry and entry.get("status") == "scheduled":
                        entry["status"] = "triggered"
                        logger.info("[ALARM] Alarm %s triggered (%s)", aid, entry.get("label") or "")
                        # Play alarm sound notification
                        await self._play_alarm_sound()
                except asyncio.CancelledError:
                    logger.info("[ALARM] Alarm %s cancelled", aid)

            task = asyncio.create_task(_alarm_worker(alarm_id, delta))
            self.alarm_tasks[alarm_id] = task

            alarm_time = dt.strftime('%I:%M %p')
            return {
                "action": "alarm_created",
                "result": {
                    "id": alarm_id,
                    "label": label,
                    "scheduled_at": dt.timestamp(),
                    "status": "scheduled",
                },
                "message": f"Alarm set for {alarm_time}. ID: {alarm_id[:8]}..."
            }
        except Exception as e:
            logger.error(f"Alarm action error: {e}")
            return {
                "action": "error",
                "result": {},
                "message": f"Error setting alarm: {str(e)}"
            }
