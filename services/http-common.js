import axios from 'axios'

export default axios.create({
  //baseURL: 'https://mkt-linebot-nodejs-production.up.railway.app/api',
  //baseURL:process.env.VUE_APP_API+"/api",
  baseURL: process.env.VITE_API_URL + '/api',
  headers: {
    'Content-type': 'application/json',
  },
})
