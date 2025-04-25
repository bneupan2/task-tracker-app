document.getElementById('signupForm').addEventListener('submit', function (e) {
    e.preventDefault();
  
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
  
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = '';
  
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passwordValid = password.length >= 8;
  
    if (!name || !email || !password) {
      errorMsg.textContent = 'All fields are required.';
      return;
    }
  
    if (!emailValid) {
      errorMsg.textContent = 'Please enter a valid email (must include "@" and ".com").';
      return;
    }
  
    if (!passwordValid) {
      errorMsg.textContent = 'Password must be at least 8 characters long.';
      return;
    }
  
    alert('Sign up successful! (Next: connect this to a database)');
  });
  