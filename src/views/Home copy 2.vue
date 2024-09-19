<template>
  <div id="app">
    <h1>Login with LINE and Send Message</h1>
    <h3>LINE User ID: {{ userId }}</h3>
    <img v-if="_profilePictureUrl" :src="_profilePictureUrl" alt="Profile Image" width="100" />
    <button v-if="!userId" @click="loginWithLINE" class="button expanded-button">Login with LINE</button>
    <button v-if="userId" @click="openLine" class="button expanded-button">Open LINE</button>
    <button v-if="userId" @click="sendMessage" class="button expanded-button">Send Message to LINE Chat</button>
    <button v-if="userId" @click="logout" class="button expanded-button">Logout</button>
  </div>
</template>

<script>
import liff from '@line/liff'

export default {
  data() {
    return {
      _profile: {},
      _profilePictureUrl: '',
      userId: null,
      accessToken: null,
      adsId: null,
      adsId_cookieValue: null,
      url: process.env.VITE_LIFF_LOGIN_URL,
      _clientId: 'YOUR_CLIENT_ID',
      _clientSecret: 'YOUR_CLIENT_SECRET',
      _api_sendMessage: process.env.VITE_API_URL + '/send-message',
    }
  },
  methods: {
    // Initialize LIFF SDK
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
          liff.login() // Redirect to LINE login if not logged in
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

      window.location.href = import.meta.env.VITE_LIFF_LINE_CHAT

      // ใช้  this.adsId find db & update lineUid
      const get_adsId_fromCookies = this.getCookie('adsId')
      this.findConvUidAndUpdateLineUid(get_adsId_fromCookies, this._profile.userId)
    },

    async findConvUidAndUpdateLineUid(convUid, lineUid) {
      console.log('find and update')
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
    this.initializeLIFF()
  },
  mounted() {
    // console.log('VITE_LIFF_ID ', import.meta.env.VITE_LIFF_ID_LOGIN)

    this.adsId = this.getQueryParam('ads_id')
    console.log(' this.adsId ', this.adsId)
    if (this.adsId) {
      this.setCookie('adsId', this.adsId, 7)
    }
  },
}
</script>

<style>
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
</style>
