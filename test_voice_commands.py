#!/usr/bin/env python3
"""
Test script for voice-activated timer, stopwatch, and alarm functionality.
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timedelta

async def test_voice_commands():
    """Test various voice commands for timers, stopwatches, and alarms."""
    
    base_url = "http://localhost:8000"
    
    async with aiohttp.ClientSession() as session:
        print("🧪 Testing Voice Commands for J.A.R.V.I.S")
        print("=" * 50)
        
        # Test timer commands
        timer_commands = [
            "set a timer for 5 minutes",
            "timer 30 seconds",
            "start a 2 hour timer",
            "10 minute timer please"
        ]
        
        print("\n⏰ TESTING TIMER COMMANDS:")
        for i, command in enumerate(timer_commands, 1):
            print(f"\n{i}. Testing: '{command}'")
            
            # Send chat message
            chat_data = {"message": command}
            async with session.post(f"{base_url}/chat", json=chat_data) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"   ✅ Response: {result['response']}")
                else:
                    print(f"   ❌ Error: {response.status}")
        
        # Test stopwatch commands
        stopwatch_commands = [
            "start stopwatch",
            "stop stopwatch"
        ]
        
        print("\n⏱️  TESTING STOPWATCH COMMANDS:")
        for i, command in enumerate(stopwatch_commands, 1):
            print(f"\n{i}. Testing: '{command}'")
            
            chat_data = {"message": command}
            async with session.post(f"{base_url}/chat", json=chat_data) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"   ✅ Response: {result['response']}")
                else:
                    print(f"   ❌ Error: {response.status}")
        
        # Test alarm commands
        future_time = datetime.now() + timedelta(hours=1)
        alarm_time = future_time.strftime('%I:%M %p')
        
        alarm_commands = [
            "set alarm for 8:30 AM",
            "alarm at 2:30 PM",
            f"wake me up at {alarm_time}",
            "set an alarm for tomorrow 9 AM"
        ]
        
        print("\n⏰ TESTING ALARM COMMANDS:")
        for i, command in enumerate(alarm_commands, 1):
            print(f"\n{i}. Testing: '{command}'")
            
            chat_data = {"message": command}
            async with session.post(f"{base_url}/chat", json=chat_data) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"   ✅ Response: {result['response']}")
                else:
                    print(f"   ❌ Error: {response.status}")
        
        # Test non-action commands (should go to normal LLM)
        print("\n🤖 TESTING NON-ACTION COMMANDS:")
        normal_commands = [
            "what is the weather like?",
            "tell me a joke",
            "how are you?"
        ]
        
        for i, command in enumerate(normal_commands, 1):
            print(f"\n{i}. Testing: '{command}'")
            
            chat_data = {"message": command}
            async with session.post(f"{base_url}/chat", json=chat_data) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"   ✅ Response: {result['response'][:100]}...")
                else:
                    print(f"   ❌ Error: {response.status}")
        
        print("\n" + "=" * 50)
        print("🎉 Voice command testing complete!")

if __name__ == "__main__":
    asyncio.run(test_voice_commands())
