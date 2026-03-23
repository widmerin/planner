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
import { validateCredentials, setAuthToken } from '~/lib/auth'

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

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300))

  if (validateCredentials(username.value, password.value)) {
    setAuthToken('authenticated')
    emit('login')
  }
  else {
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
  background: #000000;
  padding: 1rem;
}

.login-box {
  width: 100%;
  max-width: 320px;
  background: #0d0d0d;
  border: 1px solid #222222;
  padding: 2rem 1.5rem;
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
  color: #888888;
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
  border: 1px solid #333333;
  background: #1a1a1a;
  color: #ffffff;
  font-size: 0.95rem;
  border-radius: 0;
}

.form-group input::placeholder {
  color: #666666;
}

.form-group input:focus {
  outline: none;
  border-color: #666666;
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  margin-top: 0.5rem;
  border: 2px solid #ffffff;
  background: #ffffff;
  color: #000000;
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 80ms;
}

.login-btn:hover:not(:disabled) {
  background: #dddddd;
  border-color: #dddddd;
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
