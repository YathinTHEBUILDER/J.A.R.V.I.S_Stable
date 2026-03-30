// Test script to check if timer elements exist
console.log('=== TIMER UI TEST ===');
console.log('Checking timer elements...');

const timerToggle = document.getElementById('timer-toggle');
const timerPanel = document.getElementById('timer-panel');
const timerClose = document.getElementById('timer-close');

console.log('timerToggle element:', timerToggle);
console.log('timerPanel element:', timerPanel);
console.log('timerClose element:', timerClose);

if (timerToggle) {
    console.log('Timer toggle found, testing click...');
    timerToggle.addEventListener('click', function() {
        console.log('Timer toggle clicked!');
        if (timerPanel) {
            timerPanel.classList.toggle('open');
            console.log('Timer panel toggled. Open?', timerPanel.classList.contains('open'));
        }
    });
} else {
    console.error('Timer toggle NOT found!');
}

// Test voice command
fetch('/chat', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({message: 'set a timer for 3 seconds'})
})
.then(response => response.json())
.then(data => {
    console.log('Voice command test result:', data);
})
.catch(error => {
    console.error('Voice command test error:', error);
});

console.log('=== END TIMER UI TEST ===');
