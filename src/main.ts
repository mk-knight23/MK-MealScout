import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { createAppErrorHandler } from './utils/errorHandler'

const app = createApp(App)

// Global error handler: logs with component context, and in production also
// shows a minimal dismissible user notice instead of failing silently.
app.config.errorHandler = createAppErrorHandler({ isDev: import.meta.env.DEV })

app.use(createPinia())
app.mount('#app')
