// COMPLETE TIMER/STOPWATCH/ALARM FIX
// This replaces all timer functionality with working version

console.log('🔧 LOADING COMPLETE TIMER FIX...');

// Global state
let activeTimers = [];
let activeStopwatches = [];
let activeAlarms = [];

// Wait for elements to be ready
function waitForElements() {
    return new Promise((resolve) => {
        const checkElements = () => {
            const timerToggle = document.getElementById('timer-toggle');
            const timerPanel = document.getElementById('timer-panel');
            const timerBadge = document.getElementById('timer-badge');
            
            if (timerToggle && timerPanel && timerBadge) {
                console.log('✅ All timer elements found');
                resolve({ timerToggle, timerPanel, timerBadge });
            } else {
                setTimeout(checkElements, 100);
            }
        };
        checkElements();
    });
}

// Main setup
async function setupCompleteTimerSystem() {
    const { timerToggle, timerPanel, timerBadge } = await waitForElements();
    
    console.log('🚀 Setting up complete timer system...');
    
    // Setup timer toggle
    setupTimerToggle(timerToggle, timerPanel, timerBadge);
    
    // Setup quick chips
    setupQuickChips();
    
    // Setup voice command integration
    setupVoiceCommandIntegration();
    
    console.log('✅ Complete timer system loaded!');
}

// Setup timer toggle
function setupTimerToggle(timerToggle, timerPanel, timerBadge) {
    // Remove existing listeners
    const newToggle = timerToggle.cloneNode(true);
    timerToggle.parentNode.replaceChild(newToggle, timerToggle);
    
    newToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🔔 Timer toggle clicked!');
        const isOpen = timerPanel.classList.contains('open');
        timerPanel.classList.toggle('open');
        
        if (!isOpen) {
            // Opening panel - show active items
            showActiveTimers();
            showActiveStopwatches();
            showActiveAlarms();
            updateBadge();
        } else {
            // Closing panel
            updateBadge(0);
        }
    });
}

// Show active timers
function showActiveTimers() {
    const timersList = document.getElementById('timers-list');
    const timersEmpty = document.getElementById('timers-empty');
    
    if (!timersList || !timersEmpty) return;
    
    timersList.innerHTML = '';
    
    if (activeTimers.length === 0) {
        timersEmpty.style.display = 'block';
        timersList.style.display = 'none';
    } else {
        timersEmpty.style.display = 'none';
        timersList.style.display = 'flex';
        
        activeTimers.forEach(timer => {
            const timerItem = createTimerItem(timer);
            timersList.appendChild(timerItem);
        });
    }
}

// Show active stopwatches
function showActiveStopwatches() {
    const stopwatchesList = document.getElementById('stopwatches-list');
    const stopwatchesEmpty = document.getElementById('stopwatches-empty');
    
    if (!stopwatchesList || !stopwatchesEmpty) return;
    
    stopwatchesList.innerHTML = '';
    
    if (activeStopwatches.length === 0) {
        stopwatchesEmpty.style.display = 'block';
        stopwatchesList.style.display = 'none';
    } else {
        stopwatchesEmpty.style.display = 'none';
        stopwatchesList.style.display = 'flex';
        
        activeStopwatches.forEach(stopwatch => {
            const stopwatchItem = createStopwatchItem(stopwatch);
            stopwatchesList.appendChild(stopwatchItem);
        });
    }
}

// Show active alarms
function showActiveAlarms() {
    const alarmsList = document.getElementById('alarms-list');
    const alarmsEmpty = document.getElementById('alarms-empty');
    
    if (!alarmsList || !alarmsEmpty) return;
    
    alarmsList.innerHTML = '';
    
    if (activeAlarms.length === 0) {
        alarmsEmpty.style.display = 'block';
        alarmsList.style.display = 'none';
    } else {
        alarmsEmpty.style.display = 'none';
        alarmsList.style.display = 'flex';
        
        activeAlarms.forEach(alarm => {
            const alarmItem = createAlarmItem(alarm);
            alarmsList.appendChild(alarmItem);
        });
    }
}

// Create timer item
function createTimerItem(timer) {
    const div = document.createElement('div');
    div.className = 'timer-item';
    div.innerHTML = `
        <div class="timer-item-header">
            <div class="timer-item-title">${timer.label}</div>
            <div class="timer-item-status ${timer.status}">${timer.status}</div>
        </div>
        <div class="timer-item-time" id="timer-time-${timer.id}">${formatTime(timer.remaining)}</div>
        <div class="timer-item-label">ID: ${timer.id.substring(0, 8)}...</div>
        <div class="timer-item-actions">
            ${timer.status === 'running' ? `<button class="timer-btn danger" onclick="cancelTimer('${timer.id}')">Cancel</button>` : ''}
        </div>
    `;
    
    // Start countdown if running
    if (timer.status === 'running') {
        startTimerCountdown(timer);
    }
    
    return div;
}

// Create stopwatch item
function createStopwatchItem(stopwatch) {
    const div = document.createElement('div');
    div.className = 'timer-item';
    div.innerHTML = `
        <div class="timer-item-header">
            <div class="timer-item-title">Stopwatch</div>
            <div class="timer-item-status ${stopwatch.running ? 'running' : 'finished'}">${stopwatch.running ? 'Running' : 'Stopped'}</div>
        </div>
        <div class="timer-item-time" id="stopwatch-time-${stopwatch.id}">${formatTime(stopwatch.elapsed)}</div>
        <div class="timer-item-label">ID: ${stopwatch.id.substring(0, 8)}...</div>
        <div class="timer-item-actions">
            ${stopwatch.running ? `<button class="timer-btn danger" onclick="stopStopwatch('${stopwatch.id}')">Stop</button>` : '<button class="timer-btn" onclick="startStopwatch()">Start New</button>'}
        </div>
    `;
    
    // Start counter if running
    if (stopwatch.running) {
        startStopwatchCounter(stopwatch);
    }
    
    return div;
}

// Create alarm item
function createAlarmItem(alarm) {
    const div = document.createElement('div');
    div.className = 'timer-item';
    div.innerHTML = `
        <div class="timer-item-header">
            <div class="timer-item-title">${alarm.label}</div>
            <div class="timer-item-status ${alarm.status}">${alarm.status}</div>
        </div>
        <div class="timer-item-time">${formatTime(alarm.time)}</div>
        <div class="timer-item-label">ID: ${alarm.id.substring(0, 8)}...</div>
        <div class="timer-item-actions">
            ${alarm.status === 'scheduled' ? `<button class="timer-btn danger" onclick="cancelAlarm('${alarm.id}')">Cancel</button>` : ''}
        </div>
    `;
    
    return div;
}

// Start timer countdown
function startTimerCountdown(timer) {
    const timeElement = document.getElementById(`timer-time-${timer.id}`);
    if (!timeElement) return;
    
    const interval = setInterval(() => {
        timer.remaining--;
        timeElement.textContent = formatTime(timer.remaining);
        
        if (timer.remaining <= 0) {
            clearInterval(interval);
            timer.status = 'finished';
            
            // Update status
            const statusElement = timeElement.parentElement.querySelector('.timer-item-status');
            if (statusElement) {
                statusElement.textContent = 'finished';
                statusElement.className = 'timer-item-status finished';
            }
            
            // Remove cancel button
            const actionsElement = timeElement.parentElement.querySelector('.timer-item-actions');
            if (actionsElement) {
                actionsElement.innerHTML = '';
            }
            
            // Show notification and play sound
            showNotification(`Timer "${timer.label}" completed!`);
            playTimerSound();
            updateBadge();
        }
    }, 1000);
}

// Start stopwatch counter
function startStopwatchCounter(stopwatch) {
    const timeElement = document.getElementById(`stopwatch-time-${stopwatch.id}`);
    if (!timeElement) return;
    
    const interval = setInterval(() => {
        if (!stopwatch.running) {
            clearInterval(interval);
            return;
        }
        
        stopwatch.elapsed++;
        timeElement.textContent = formatTime(stopwatch.elapsed);
    }, 1000);
}

// Format time
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Play timer sound
function playTimerSound() {
    try {
        // Play 3 loud beeps
        const audioContext = new (window.AudioContext || window.webkitAudioContext());
        
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 1000;
                oscillator.type = 'sine';
                gainNode.gain.value = 0.3;
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.3);
            }, i * 400);
        }
    } catch (error) {
        console.log('Sound not available:', error);
    }
}

// Show notification
function showNotification(message) {
    console.log('🔔 Notification:', message);
    
    // Browser notification
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
        if (Notification.permission === 'granted') {
            new Notification('J.A.R.V.I.S Timer', {
                body: message,
                icon: '/favicon.ico'
            });
        }
    }
    
    // Toast notification
    if (typeof showToast === 'function') {
        showToast(message, 5000);
    } else {
        // Fallback toast
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; 
            background: #7c6aef; color: white; 
            padding: 12px 20px; border-radius: 8px; 
            z-index: 9999; font-size: 14px;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }
}

// Control functions
function cancelTimer(timerId) {
    const timer = activeTimers.find(t => t.id === timerId);
    if (timer) {
        timer.status = 'cancelled';
        activeTimers = activeTimers.filter(t => t.id !== timerId);
        showNotification('Timer cancelled!');
        showActiveTimers();
        updateBadge();
    }
}

function stopStopwatch(stopwatchId) {
    const stopwatch = activeStopwatches.find(s => s.id === stopwatchId);
    if (stopwatch) {
        stopwatch.running = false;
        showNotification('Stopwatch stopped!');
        showActiveStopwatches();
        updateBadge();
    }
}

function startStopwatch() {
    const stopwatch = {
        id: 'stopwatch-' + Date.now(),
        running: true,
        elapsed: 0
    };
    
    activeStopwatches.push(stopwatch);
    showNotification('Stopwatch started!');
    showActiveStopwatches();
    updateBadge();
}

function cancelAlarm(alarmId) {
    activeAlarms = activeAlarms.filter(a => a.id !== alarmId);
    showNotification('Alarm cancelled!');
    showActiveAlarms();
    updateBadge();
}

// Update badge
function updateBadge(count = null) {
    const badge = document.getElementById('timer-badge');
    if (!badge) return;
    
    if (count === null) {
        count = activeTimers.filter(t => t.status === 'running').length + 
               activeStopwatches.filter(s => s.running).length + 
               activeAlarms.filter(a => a.status === 'scheduled').length;
    }
    
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

// Setup voice command integration
function setupVoiceCommandIntegration() {
    // Intercept chat messages to detect timer commands
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    
    if (messageInput && sendButton) {
        const originalSend = sendButton.onclick;
        
        sendButton.onclick = () => {
            const message = messageInput.value.trim().toLowerCase();
            
            // Check for timer commands
            if (message.includes('timer') || message.includes('stopwatch') || message.includes('alarm')) {
                handleVoiceCommand(messageInput.value);
            }
            
            if (originalSend) originalSend();
        };
    }
}

// Handle voice commands
function handleVoiceCommand(message) {
    const lowerMessage = message.toLowerCase();
    
    // Timer commands
    if (lowerMessage.includes('timer') && lowerMessage.includes('second')) {
        const match = lowerMessage.match(/(\d+)\s*second/);
        if (match) {
            const seconds = parseInt(match[1]);
            startTimer(seconds, 'Voice Timer');
        }
    }
    
    if (lowerMessage.includes('timer') && lowerMessage.includes('minute')) {
        const match = lowerMessage.match(/(\d+)\s*minute/);
        if (match) {
            const minutes = parseInt(match[1]);
            startTimer(minutes * 60, 'Voice Timer');
        }
    }
    
    // Stopwatch commands
    if (lowerMessage.includes('start stopwatch')) {
        startStopwatch();
    }
    
    if (lowerMessage.includes('stop stopwatch')) {
        if (activeStopwatches.length > 0) {
            stopStopwatch(activeStopwatches[0].id);
        }
    }
    
    // Alarm commands
    if (lowerMessage.includes('alarm')) {
        const timeMatch = lowerMessage.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
        if (timeMatch) {
            const [, hours, minutes, period] = timeMatch;
            setAlarm(hours, minutes, period.toUpperCase(), 'Voice Alarm');
        }
    }
}

// Start timer
function startTimer(seconds, label) {
    const timer = {
        id: 'timer-' + Date.now(),
        label: label,
        status: 'running',
        remaining: seconds,
        total: seconds
    };
    
    activeTimers.push(timer);
    showNotification(`Timer started for ${formatTime(seconds)}`);
    showActiveTimers();
    updateBadge();
}

// Set alarm
function setAlarm(hours, minutes, period, label) {
    const alarm = {
        id: 'alarm-' + Date.now(),
        label: label,
        status: 'scheduled',
        time: `${hours}:${minutes} ${period}`
    };
    
    activeAlarms.push(alarm);
    showNotification(`Alarm set for ${alarm.time}`);
    showActiveAlarms();
    updateBadge();
    
    // Set Windows alarm (if possible)
    try {
        // This would require additional Windows API integration
        console.log(`Windows alarm would be set for ${alarm.time}`);
    } catch (error) {
        console.log('Windows alarm not available:', error);
    }
}

// Setup quick chips
function setupQuickChips() {
    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const text = chip.textContent.trim();
            handleVoiceCommand(text);
            
            // Also send to chat
            const messageInput = document.getElementById('message-input');
            const sendButton = document.getElementById('send-button');
            
            if (messageInput && sendButton) {
                messageInput.value = text;
                sendButton.click();
            }
        });
    });
}

// Auto-initialize
setTimeout(setupCompleteTimerSystem, 1000);

console.log('🎉 COMPLETE TIMER FIX LOADED!');
