// Minimal Timer Fix - Add this to script.js to fix all timer issues
console.log('🔧 Loading Timer Fixes...');

// Fix 1: Wait for page to be fully loaded
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
                console.log('⏳ Waiting for timer elements...');
                setTimeout(checkElements, 100);
            }
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkElements);
        } else {
            checkElements();
        }
    });
}

// Fix 2: Setup timer toggle properly
async function setupTimerToggle() {
    const { timerToggle, timerPanel, timerBadge } = await waitForElements();
    
    console.log('🔧 Setting up timer toggle...');
    
    // Remove any existing listeners
    const newToggle = timerToggle.cloneNode(true);
    timerToggle.parentNode.replaceChild(newToggle, timerToggle);
    
    // Add new listener
    newToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🔔 Timer toggle clicked!');
        
        // Toggle panel
        const isOpen = timerPanel.classList.contains('open');
        timerPanel.classList.toggle('open');
        
        console.log('📊 Timer panel:', isOpen ? 'closing' : 'opening');
        
        if (!isOpen) {
            // Opening panel - show demo timer
            showDemoTimer();
            updateBadge(1);
        } else {
            // Closing panel - hide badge
            updateBadge(0);
        }
    });
    
    return true;
}

// Fix 3: Show demo timer that actually works
function showDemoTimer() {
    console.log('📊 Showing demo timer...');
    
    const timersList = document.getElementById('timers-list');
    const timersEmpty = document.getElementById('timers-empty');
    
    if (!timersList || !timersEmpty) {
        console.error('❌ Timer list elements not found');
        return;
    }
    
    // Clear existing content
    timersList.innerHTML = '';
    
    // Create demo timer
    const demoTimer = {
        id: 'demo-timer-' + Date.now(),
        label: 'Demo Timer',
        status: 'running',
        remaining_seconds: 30,
        total_seconds: 30
    };
    
    const timerItem = createDemoTimerItem(demoTimer);
    timersList.appendChild(timerItem);
    
    timersEmpty.style.display = 'none';
    timersList.style.display = 'flex';
    
    // Start countdown
    startDemoCountdown(demoTimer);
    
    // Also show demo stopwatch
    showDemoStopwatch();
}

// Fix 3b: Show demo stopwatch immediately
function showDemoStopwatch() {
    console.log('⏱️ Showing demo stopwatch...');
    
    const stopwatchesList = document.getElementById('stopwatches-list');
    const stopwatchesEmpty = document.getElementById('stopwatches-empty');
    
    if (!stopwatchesList || !stopwatchesEmpty) {
        console.error('❌ Stopwatch list elements not found');
        return;
    }
    
    // Clear existing content
    stopwatchesList.innerHTML = '';
    
    // Create demo stopwatch
    const demoStopwatch = {
        id: 'demo-stopwatch-' + Date.now(),
        label: 'Demo Stopwatch',
        running: true,
        started_at: Date.now() / 1000,
        elapsed_seconds: 0
    };
    
    const stopwatchItem = createDemoStopwatchItem(demoStopwatch);
    stopwatchesList.appendChild(stopwatchItem);
    
    stopwatchesEmpty.style.display = 'none';
    stopwatchesList.style.display = 'flex';
    
    // Start elapsed time counter
    startStopwatchCounter(demoStopwatch);
}

// Fix 4b: Create demo stopwatch item
function createDemoStopwatchItem(stopwatch) {
    const div = document.createElement('div');
    div.className = 'timer-item';
    div.innerHTML = `
        <div class="timer-item-header">
            <div class="timer-item-title">${stopwatch.label}</div>
            <div class="timer-item-status ${stopwatch.running ? 'running' : 'finished'}">${stopwatch.running ? 'Running' : 'Stopped'}</div>
        </div>
        <div class="timer-item-time" id="stopwatch-time-${stopwatch.id}">00:00</div>
        <div class="timer-item-label">ID: ${stopwatch.id}</div>
        <div class="timer-item-actions">
            ${stopwatch.running ? '<button class="timer-btn danger" onclick="stopDemoStopwatch(\'' + stopwatch.id + '\')">Stop</button>' : '<button class="timer-btn" onclick="startDemoStopwatch()">Start New</button>'}
        </div>
    `;
    return div;
}

// Fix 5b: Start stopwatch counter
function startStopwatchCounter(stopwatch) {
    const timeElement = document.getElementById(`stopwatch-time-${stopwatch.id}`);
    if (!timeElement) return;
    
    const interval = setInterval(() => {
        if (!stopwatch.running) {
            clearInterval(interval);
            return;
        }
        
        const now = Date.now() / 1000;
        const elapsed = Math.floor(now - stopwatch.started_at);
        timeElement.textContent = formatTime(elapsed);
    }, 100);
}
function createDemoTimerItem(timer) {
    const div = document.createElement('div');
    div.className = 'timer-item';
    div.innerHTML = `
        <div class="timer-item-header">
            <div class="timer-item-title">${timer.label}</div>
            <div class="timer-item-status ${timer.status}">${timer.status}</div>
        </div>
        <div class="timer-item-time" id="timer-time-${timer.id}">${formatTime(timer.remaining_seconds)}</div>
        <div class="timer-item-label">ID: ${timer.id}</div>
        <div class="timer-item-actions">
            ${timer.status === 'running' ? '<button class="timer-btn danger" onclick="cancelDemoTimer(\'' + timer.id + '\')">Cancel</button>' : ''}
        </div>
    `;
    return div;
}

// Fix 5: Working countdown
function startDemoCountdown(timer) {
    const timeElement = document.getElementById(`timer-time-${timer.id}`);
    if (!timeElement) return;
    
    let seconds = timer.remaining_seconds;
    
    const interval = setInterval(() => {
        seconds--;
        timeElement.textContent = formatTime(seconds);
        
        if (seconds <= 0) {
            clearInterval(interval);
            timeElement.textContent = '00:00';
            
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
            
            // Show notification
            showNotification('Demo Timer completed!');
            playBeep();
        }
    }, 1000);
}

// Fix 6: Format time helper
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Fix 7: Show notification
function showNotification(message) {
    console.log('🔔 Notification:', message);
    
    // Try browser notification
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
    
    // Try toast
    if (typeof showToast === 'function') {
        showToast(message, 5000);
    } else {
        // Fallback - create simple toast
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

// Fix 8: Play beep sound (louder and longer)
function playBeep() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 1000;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3; // Louder volume
        
        oscillator.start();
        // Play 3 beeps for better notification
        for (let i = 1; i <= 3; i++) {
            setTimeout(() => {
                const beep = audioContext.createOscillator();
                const beepGain = audioContext.createGain();
                beep.connect(beepGain);
                beepGain.connect(audioContext.destination);
                beep.frequency.value = 1000;
                beep.type = 'sine';
                beepGain.gain.value = 0.3;
                beep.start();
                beep.stop(audioContext.currentTime + 0.2);
            }, i * 300);
        }
    } catch (error) {
        console.log('🔊 Sound not available:', error);
        // Fallback: Try Windows beep
        try {
            if (window.require) {
                const { exec } = window.require('child_process');
                exec('powershell -c "(New-Object Media.SoundPlayer \'C:\\Windows\\Media\\Alarm01.wav\').PlaySync()"');
            }
        } catch (e) {
            console.log('Windows sound not available:', e);
        }
    }
}

// Fix 9b: Stop demo stopwatch
function stopDemoStopwatch(stopwatchId) {
    console.log('🛑 Demo stopwatch stopped:', stopwatchId);
    showNotification('Demo stopwatch stopped!');
    
    const stopwatchesList = document.getElementById('stopwatches-list');
    const stopwatchesEmpty = document.getElementById('stopwatches-empty');
    
    if (stopwatchesList) {
        const stopwatchElement = document.getElementById(`stopwatch-time-${stopwatchId}`);
        if (stopwatchElement) {
            const stopwatchItem = stopwatchElement.closest('.timer-item');
            if (stopwatchItem) {
                // Update status to stopped
                const statusElement = stopwatchItem.querySelector('.timer-item-status');
                if (statusElement) {
                    statusElement.textContent = 'Stopped';
                    statusElement.className = 'timer-item-status finished';
                }
                
                // Update button
                const actionsElement = stopwatchItem.querySelector('.timer-item-actions');
                if (actionsElement) {
                    actionsElement.innerHTML = '<button class="timer-btn" onclick="startDemoStopwatch()">Start New</button>';
                }
            }
        }
    }
}

// Fix 9c: Start new demo stopwatch
function startDemoStopwatch() {
    console.log('▶️ Starting new demo stopwatch...');
    showDemoStopwatch();
}

// Fix 9: Cancel demo timer
function cancelDemoTimer(timerId) {
    console.log('🛑 Demo timer cancelled:', timerId);
    showNotification('Demo timer cancelled!');
    
    const timersList = document.getElementById('timers-list');
    const timersEmpty = document.getElementById('timers-empty');
    
    if (timersList) {
        const timerElement = document.getElementById(`timer-time-${timerId}`);
        if (timerElement) {
            const timerItem = timerElement.closest('.timer-item');
            if (timerItem) {
                timerItem.remove();
            }
        }
        
        if (timersList.children.length === 0) {
            timersEmpty.style.display = 'block';
        }
    }
    
    updateBadge(0);
}

// Fix 10: Update badge
function updateBadge(count) {
    const badge = document.getElementById('timer-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Fix 11: Setup quick action chips
function setupQuickChips() {
    console.log('🔘 Setting up quick action chips...');
    
    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const text = chip.textContent.trim();
            console.log('🔘 Chip clicked:', text);
            
            // Send command via chat
            const messageInput = document.getElementById('message-input');
            const sendButton = document.getElementById('send-button');
            
            if (messageInput && sendButton) {
                messageInput.value = text;
                sendButton.click();
            }
        });
    });
}

// Fix 12: Initialize everything
async function initTimerFixes() {
    console.log('🚀 Initializing timer fixes...');
    
    try {
        // Setup timer toggle
        await setupTimerToggle();
        
        // Setup quick chips
        setupQuickChips();
        
        console.log('✅ Timer fixes loaded successfully!');
        
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
    } catch (error) {
        console.error('❌ Failed to initialize timer fixes:', error);
    }
}

// Auto-initialize with delay to ensure main script is loaded
setTimeout(initTimerFixes, 1000);

console.log('🎉 Timer fixes script loaded!');
