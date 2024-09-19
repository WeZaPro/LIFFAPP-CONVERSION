<template>
  <div id="container">
    <!-- <h1>Login with LINE and Send Message</h1>
    <h3>LINE User ID: {{ userId }}</h3> -->
    <!-- <img v-if="userId" :src="imgShow" alt="Shop Image" width="300" />
    <img v-if="userId" :src="imgBanner" alt="Shop Image" width="300" /> -->
    <div id="app">
      <img :src="imgShow" alt="Shop Image" width="350" />

      <button v-if="!_userId" @click="loginWithQRCode" class="button">Login with LINE</button>
      <button v-if="_userId" @click="openLine" class="button">Line Chat</button>
      <button v-if="_userId" @click="sendMessage" class="button">Send Message to LINE Chat</button>
      <button v-if="_userId" @click="logout" class="button">Logout</button>
      <img :src="imgBanner" alt="Shop Image" width="300" />
    </div>

    <!-- <img v-if="_profilePictureUrl" :src="_profilePictureUrl" alt="Profile Image" width="100" /> -->

    <!-- <button v-if="!userId" @click="sendMessage" class="button">Send Message to LINE Chat</button> -->
  </div>
</template>

<script>
import liff from '@line/liff'
import axios from 'axios'
import Cookies from 'js-cookie'

export default {
  data() {
    return {
      imgShow:
        'https://png.pngtree.com/png-vector/20220707/ourmid/pngtree-chatbot-robot-concept-chat-bot-png-image_5632381.png',
      imgBanner: 'https://www.doctorgarn.com/wp-content/uploads/2024/01/font-2.png',
      _profile: {},
      _profilePictureUrl: '',
      userId: null,
      _userId: null,
      lineUid_fromToken: '',
      accessToken: null,
      adsId: null,
      adsId_cookieValue: null,
      // url: process.env.VITE_LIFF_LOGIN_URL,
      // _clientId: 'YOUR_CLIENT_ID',
      // _clientSecret: 'YOUR_CLIENT_SECRET',
      // _api_sendMessage: process.env.VITE_API_URL + '/send-message',
    }
  },
  methods: {
    getLineUserProfile(token) {
      axios
        .get('https://api.line.me/v2/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then(response => {
          this._userId = response.data.userId

          // ตั้งค่า cookie ด้วย js-cookie
          Cookies.set('_userId', this._userId, { expires: 7, path: '/' })
          // this.lineUid = userId
          console.log('LINE _userId ID:', this._userId)
        })
        .catch(error => {
          console.error('Error fetching user profile:', error)
        })
    },
    loginWithQRCode() {
      // const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${
      //   import.meta.env.VITE_APP_LINE_CHANNEL_ID
      // }&redirect_uri=${
      //   import.meta.env.VITE_APP_LINE_REDIRECT_URI
      // }&state=randomstring&scope=profile%20openid&prompt=consent`
      // window.location.href = lineLoginUrl

      const clientId = import.meta.env.VITE_APP_LINE_CHANNEL_ID // Channel ID ของคุณ
      const redirectUri = encodeURIComponent(import.meta.env.VITE_APP_BACKEND_CALLBACK) // ต้องตรงกับที่ลงทะเบียนใน LINE Developers Console
      const state = 'AppLiffDemo' // รหัสสถานะที่คุณสามารถกำหนดได้ (ใช้สำหรับป้องกัน CSRF)
      const scope = encodeURIComponent('profile openid email') // ขอบเขตสิทธิ์ที่คุณต้องการเข้าถึง
      const uri = 'https://schoolshopliffweb.onrender.com'

      // สร้าง URL สำหรับการล็อกอิน
      // const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}&prompt=consent`
      const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${uri}&scope=${scope}&prompt=consent`
      // ทำ redirect ไปยัง URL การล็อกอิน
      window.location.href = lineLoginUrl
    },
    // Initialize LIFF SDK
    // lll
    async initializeLIFF() {
      try {
        // await liff.init({ liffId: '1656824759-KYL5BkQ6' })
        await liff.init({ liffId: import.meta.env.VITE_LIFF_ID_LOGIN })
        if (liff.isLoggedIn()) {
          await this.getUserProfile() // Ensure this is awaited to get the result
          // console.log('User ID:', this.userId) // This will print the userId
          liff.getProfile().then(profile => {
            this._profile = profile
            console.log('this.profile.userId:', this._profile.userId)
            console.log('this.profile.displayName:', this._profile.displayName)
          })
        } else {
          // liff.login() // Redirect to LINE login if not logged in
          // alert('Please Login')
          console.log('Login')
        }
      } catch (error) {
        console.error('LIFF initialization failed:', error)
      }
    },

    // Login with LINE using LIFF
    loginWithLINE() {
      if (typeof liff === 'undefined') {
        console.error('LIFF SDK is not loaded.')
        return
      }
      liff.login()
    },

    // Get user profile from LIFF
    async getUserProfile() {
      if (typeof liff === 'undefined') {
        console.error('LIFF SDK is not loaded.')
        return
      }

      try {
        const profile = await liff.getProfile()
        this.userId = profile.userId
        console.log('userId ', this.userId)
        this._profilePictureUrl = profile.pictureUrl
        this.setCookie('userId', this.userId, 7)
      } catch (error) {
        console.error('Failed to get user profile:', error)
      }
    },

    // Open LINE chat
    openLine() {
      //window.location.href = 'line://ti/p/@454nqxks'

      window.location.href = import.meta.env.VITE_LINE_CHAT_BOT

      // ใช้  this.adsId find db & update lineUid
      const get_adsId_fromCookies = this.getCookie('adsId')
      this.findConvUidAndUpdateLineUid(get_adsId_fromCookies, this._userId)
    },

    async findConvUidAndUpdateLineUid(convUid, lineUid) {
      console.log('find and update')
      console.log('convUid ', convUid)
      console.log('lineUid ', lineUid)
      try {
        const response = await fetch(import.meta.env.VITE_API_URL + '/findConvUidToUpdateLineUid', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Authorization: 'Bearer your-token-here', // สามารถเพิ่ม Header ที่ต้องการได้
          },
          body: JSON.stringify({
            convUserId: convUid,
            lineUid: lineUid,
          }),
        })

        const data = await response.json()
        console.log(data)
        this.sendMessage()
      } catch (error) {
        console.error('Error sending data:', error)
      }
    },

    // Send a message using Messaging API
    sendMessage() {
      const messagePayload = {
        to: this.userId,
        messages: [
          {
            type: 'text',
            text: 'Hello from Vue.js! | user id : ' + this.userId,
          },
          {
            type: 'text',
            text: 'XMJ7WeHHv/jhWWGEeDqV3PxO7fuxAtRumykv5/hm4ZqD+dQac2XtZiQySQavmI38CcwkeucAeTgiVRg1nyv6bE95TkrNDURLRYqM1PjmgfkZ7EQHWiBT5/sIAhIs7iyr6FAKSBvTEX3bfmKVVKGB4gdB04t89/1O/w1cDnyilFU=',
          },
        ],
      }

      // fetch(this._api_sendMessage, {
      fetch(import.meta.env.VITE_API_URL + '/send-message', {
        // fetch('https://node-conv-api-production.up.railway.app/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      })
        .then(response => {
          if (response.ok) {
            alert('Message sent successfully!')
          } else {
            alert('Failed to send message')
          }
        })
        .catch(error => {
          console.error('Error:', error)
        })
    },

    // Logout
    logout() {
      if (typeof liff === 'undefined') {
        console.error('LIFF SDK is not loaded.')
        return
      }

      liff.logout()
      this.userId = null
      this.accessToken = null
      window.location.href = '/'
    },

    // Set a cookie
    setCookie(name, value, days) {
      let expires = ''
      if (days) {
        const date = new Date()
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
        expires = '; expires=' + date.toUTCString()
      }
      document.cookie = name + '=' + (value || '') + expires + '; path=/'
    },

    getCookie(name) {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop().split(';').shift()
    },

    getQueryParam(name) {
      const urlParams = new URLSearchParams(window.location.search)
      const liffState = urlParams.get('liff.state')
      if (liffState) {
        const queryParams = new URLSearchParams(liffState.replace(/^\?/, ''))
        return queryParams.get(name)
      }
      return null
    },
  },
  created() {
    // this.initializeLIFF()

    // ดึง token จาก URL query string
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')

    if (token) {
      // ใช้ token เพื่อเรียก LINE API สำหรับดึงข้อมูลผู้ใช้
      this.getLineUserProfile(token)
    } else {
      console.error('No token found in query string')
    }
  },
  mounted() {
    // console.log('VITE_LIFF_ID ', import.meta.env.VITE_LIFF_ID_LOGIN)
    this.lineUid_fromToken = Cookies.get('_userId')
    if (this.lineUid_fromToken) {
      console.log('User ID from cookie:', this.lineUid_fromToken)
      this._userId = this.lineUid_fromToken
    }

    this.adsId = this.getQueryParam('ads_id')
    console.log(' this.adsId ', this.adsId)
    if (this.adsId) {
      this.setCookie('adsId', this.adsId, 7)
    }
  },
}
</script>

<!-- <style>
.button {
  display: inline-block;
  padding: 12px 24px;
  margin: 10px;
  font-size: 16px;
  color: #fff;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
}

.button:hover {
  background-color: #0056b3;
}

.expanded-button {
  width: 100%;
}
</style> -->

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
}
img {
  margin-top: 10px;
}

#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
}

.button {
  width: 40%;
  margin: 10px;
  padding: 10px;
  font-size: 1.2em;
  text-align: center;
  border: none;
  border-radius: 5px;
  background-color: #067904;
  color: white;
  cursor: pointer;
}

.button:hover {
  background-color: #7a035f;
}
</style>
