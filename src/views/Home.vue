<template>
  <div id="container">
    <div id="app" v-if="botUserId ? botUserId : inVisible">
      <img :src="imgShowA" alt="Shop Image" width="350" />
    </div>

    <div id="app" v-if="botUserId ? botUserId : isVisible">
      <img :src="imgShow" alt="Shop Image" width="350" />
      {{ _userId }}
      <button v-if="!_userId" @click="loginWithQRCode" class="button">Login with LINE</button>
      <button v-if="_userId" @click="openLine" class="button">Line Chat</button>
      <!-- <button v-if="_userId" @click="logout" class="button">Logout</button> -->
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
      //
      userAgent: '',
      isDesktop: false,
      //
      lineDestination: null,
      botUserId: null,
      line_userId: null,
      isVisible: true, // ค่าเริ่มต้นแสดง div เมื่อ botuser มีค่า
      inVisible: false, // ค่าเริ่มต้นซ่อน div เมื่อ botuser ไม่มีค่า
      imgShow: 'https://www.doctorgarn.com/wp-content/uploads/2024/01/bg4-03.png',

      imgBanner: 'https://www.doctorgarn.com/wp-content/uploads/2024/01/font-2.png',
      _profile: {},
      _profilePictureUrl: '',
      userId: null,
      _userId: null,
      lineUid_fromToken: '',
      accessToken: null,
      adsId: null,
      adsId_cookieValue: null,
      cus_id: null,
      CustomerData: null,
      line_messaging_token: null,

      VITE_APP_LINE_CHANNEL_ID: null,
      VITE_APP_BACKEND_CALLBACK: null,
      VITE_APP_LINE_REDIRECT_URI: null,
      VITE_LIFF_ID_LOGIN: null,
      VITE_LINE_CHAT_BOT: null,
      VITE_URI: 'https://schoolshopliffweb.onrender.com',
    }
  },
  methods: {
    toggleVisibility() {
      this.isVisible = !this.isVisible // สลับการแสดง/ซ่อน
    },
    getLineUserProfile(token) {
      axios
        .get('https://api.line.me/v2/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then(response => {
          console.log('getLineUserProfile => response ', response)
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
      //test
      this.userAgent = navigator.userAgent.toLowerCase()
      this.isDesktop = !/mobile|android|iphone|ipad|tablet/.test(this.userAgent)
      console.log('loginWithQRCode-this.isDesktop ----> :', this.isDesktop)

      // const clientId = import.meta.env.VITE_APP_LINE_CHANNEL_ID // Channel ID ของคุณ
      const clientId = this.VITE_APP_LINE_CHANNEL_ID // Channel ID ของคุณ
      const redirectUri = encodeURIComponent(this.VITE_APP_LINE_REDIRECT_URI)

      const state = 'App123-Cus' // รหัสสถานะที่คุณสามารถกำหนดได้ (ใช้สำหรับป้องกัน CSRF)
      const scope = encodeURIComponent('profile openid email') // ขอบเขตสิทธิ์ที่คุณต้องการเข้าถึง

      const uri = this.VITE_URI

      // const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${uri}&scope=${scope}&prompt=consent`
      // Login Qrcode
      const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${uri}&scope=${scope}&bot_prompt=normal&ui_locales=th-TH&disable_auto_login=true&initial_amr_display=lineqr` //
      // ทำ redirect ไปยัง URL การล็อกอิน
      window.location.href = lineLoginUrl

      // if (this.isDesktop == true) {
      //   this.lineLinkLogin = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${_clientId}&redirect_uri=${_redirectUri}&state=${_uri}&scope=${_scope}&bot_prompt=normal&ui_locales=th-TH&disable_auto_login=true&initial_amr_display=lineqr`
      // } else {
      //   this.lineLinkLogin = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${_clientId}&redirect_uri=${_redirectUri}&state=${_uri}&scope=${_scope}&prompt=consent`
      // }
    },
    // Initialize LIFF SDK
    // lll
    async initializeLIFF() {
      try {
        await liff.init({ liffId: this._VITE_LIFF_ID_LOGIN })
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
    async getBotUserIdFromUrl() {
      try {
        // ดึง query string จาก URL
        const queryString = window.location.search
        const urlParams = new URLSearchParams(queryString)

        console.log('getBotUserIdFromUrl urlParams ', urlParams)

        // ดึงค่า liff.state จาก URL
        const liffState = urlParams.get('liff.state')
        console.log('getBotUserIdFromUrl liffState ', liffState)

        if (liffState) {
          // Decode ค่าจาก liff.state
          const decodedState = decodeURIComponent(liffState)
          console.log('getBotUserIdFromUrl decodedState ', liffState)

          // ใช้ URLSearchParams ดึงค่า botUserId จาก liff.state ที่ decode แล้ว
          const stateParams = new URLSearchParams(decodedState)
          this.botUserId = stateParams.get('botUserId')
          console.log('getBotUserIdFromUrl botUserId ', this.botUserId)
          this.updateLineBotUserId(this.botUserId)

          // update customer data
          this.lineDestination = stateParams.get('lineDestination')
          console.log('getBotUserIdFromUrl lineDestination ', this.lineDestination)

          const customer_id = await this.findCusIdFromGTM(this.line_userId, this.lineDestination, this.botUserId)
        }
      } catch (err) {
        console.log('err ', err)
      }
    },
    async findCusDataFromCustomer() {
      const _cus_id = Cookies.get('cus_id')
      const payload = {
        cus_id: _cus_id,
        // line_user_id: 'U634375582d774e1c8ce69c31f6f1ba48',
      }

      const response_cus_data = await axios.post(`${import.meta.env.VITE_API_URL}/api/customer/searchCusData`, payload)

      this.CustomerData = response_cus_data.data
      console.log('this.CustomerData ', this.CustomerData)
      this.line_messaging_token = this.CustomerData.line_msg_api_token
      console.log('*** this.line_messaging_token ', this.line_messaging_token)

      this.VITE_APP_LINE_CHANNEL_ID = this.CustomerData.line_login_channel_id
      console.log('*** VITE_APP_LINE_CHANNEL_ID ', this.VITE_APP_LINE_CHANNEL_ID)

      this.VITE_LIFF_ID_LOGIN = this.CustomerData.line_liff_login_id
      console.log('*** VITE_LIFF_ID_LOGIN', this.VITE_LIFF_ID_LOGIN)

      this.VITE_LINE_CHAT_BOT = this.CustomerData.line_OA
      console.log('*** VITE_LINE_CHAT_BOT ', this.VITE_LINE_CHAT_BOT)

      this.VITE_APP_LINE_REDIRECT_URI = 'https://node-conv-api-production.up.railway.app/callback'
    },
    async findCusIdFromGTM(_line_userId, _lineDestination, _botUserId) {
      // async findCusIdFromGTM(_line_userId) {
      // console.log('update cus data > line_userId ', _line_userId)
      const payload = {
        line_user_id: _line_userId,
        // line_user_id: 'U634375582d774e1c8ce69c31f6f1ba48',
      }
      const response_cus_id = await axios.post(`${import.meta.env.VITE_API_URL}/api/customer/searchCusId`, payload)

      // console.log('response_cus_id ', response_cus_id.data.data)
      console.log('response_cus_id.data ', response_cus_id.data)

      const _customer_id = response_cus_id.data.data
      console.log('_customer_id ', _customer_id)

      // รอก่อน *******************
      if (_customer_id) {
        this.findCusIdAndUpdateLineToGTM(_customer_id, _lineDestination)
      }

      // return response_cus_id.data.customer_id
    },

    async findCusIdAndUpdateLineToGTM(cusid, lineDestination) {
      console.log('findCusIdAndUpdateLineToGTM >cusid  ', cusid)
      console.log('findCusIdAndUpdateLineToGTM >lineDestination  ', lineDestination)

      const payload = {
        customer_id: cusid,
        line_bot_destination: lineDestination,
      }
      //VITE_API_URL
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/customer/findAndUpdateLine`, payload)
        if (response.data) {
          console.log(response.data) // Handle response data
        }
      } catch (error) {
        console.error(error) // Handle error
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
      window.location.href = this.VITE_LINE_CHAT_BOT

      // ใช้  this.adsId find db & update lineUid
      const get_adsId_fromCookies = this.getCookie('adsId')

      this.findConvUidAndUpdateLineUid(get_adsId_fromCookies, this._userId)
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
    async updateLineBotUserId(_botUid) {
      //
      this.line_userId = Cookies.get('_userId')

      const payload = {
        lineUid: this.line_userId,
        lineBotUid: _botUid,
      }
      //VITE_API_URL
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/updateLineBotId`, payload)
        console.log(response.data) // Handle response data
      } catch (error) {
        console.error(error) // Handle error
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
      this._userId = null
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
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')

    this.cus_id = this.getQueryParam('cus_id')
    console.log(' this.cus_id ', this.cus_id)

    if (this.cus_id) {
      this.setCookie('cus_id', this.cus_id, 7)
    }

    // this.getBotUserIdFromUrl()

    if (token) {
      // ใช้ token เพื่อเรียก LINE API สำหรับดึงข้อมูลผู้ใช้
      this.getLineUserProfile(token)
    } else {
      console.error('No token found in query string')
    }
  },
  mounted() {
    // get customer data ******************
    console.log('this._userId ', this._userId)
    // this.updateLineBotUserId()
    this.getBotUserIdFromUrl()
    this.findCusDataFromCustomer()
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
