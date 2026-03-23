<template>
  <div class="login-container">
    <div class="login-box">
      <h1>Week Planner</h1>
      <p class="login-subtitle">Running Schedule Tracker</p>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="Enter username"
            autofocus
          >
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter password"
            @keyup.enter="handleLogin"
          >
        </div>

        <button type="submit" class="login-btn" :disabled="isLoading">
          {{ isLoading ? 'Logging in…' : 'Sign In' }}
        </button>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { login } from '~/lib/auth'

const username = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const emit = defineEmits<{
  login: []
}>()

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    await login(username.value, password.value)
    emit('login')
  }
  catch {
    errorMessage.value = 'Invalid username or password'
  }

  isLoading.value = false
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(103, 240, 192, 0.18), transparent 26%),
    radial-gradient(circle at top right, rgba(255, 111, 145, 0.16), transparent 24%),
    linear-gradient(180deg, #08101d 0%, #030914 100%);
  padding: 1rem;
}

.login-box {
  width: 100%;
  max-width: 320px;
  background: linear-gradient(180deg, rgba(11, 23, 39, 0.95), rgba(8, 18, 33, 0.92));
  border: 1px solid rgba(132, 170, 255, 0.18);
  border-radius: 24px;
  padding: 2rem 1.5rem;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.24);
}

.login-box h1 {
  margin: 0 0 0.3rem;
  font-size: 1.6rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.login-subtitle {
  margin: 0 0 1.5rem;
  color: #90a0c0;
  font-size: 0.9rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.4rem;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 0.7rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #ffffff;
  font-size: 0.95rem;
  border-radius: 16px;
}

.form-group input::placeholder {
  color: #666666;
}

.form-group input:focus {
  outline: none;
  border-color: rgba(103, 240, 192, 0.5);
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  margin-top: 0.5rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #67f0c0, #7de7ff);
  color: #03131f;
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 140ms ease;
  box-shadow: 0 10px 30px rgba(103, 240, 192, 0.22);
}

.login-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #82ffd7, #8aeaff);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  margin-top: 1rem;
  color: #ff6b6b;
  font-size: 0.9rem;
  text-align: center;
  font-weight: 600;
}
</style>
