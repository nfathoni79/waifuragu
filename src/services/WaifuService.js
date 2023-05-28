import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'https://api.waifu.pics',
  headers: {
    Accept: 'application/json',
  },
})

const getWaifu = () => apiClient.get('/sfw/waifu')

export default { getWaifu }