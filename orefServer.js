{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fmodern\fcharset0 Courier;}
{\colortbl;\red255\green255\blue255;\red0\green0\blue0;}
{\*\expandedcolortbl;;\cssrgb\c0\c0\c0;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\deftab720
\pard\pardeftab720\partightenfactor0

\f0\fs26 \cf0 \expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 const express = require('express');\
const axios = require('axios');\
const cors = require('cors');\
\
const app = express();\
app.use(cors()); // \uc0\u1502 \u1488 \u1508 \u1513 \u1512  \u1500 \u1488 \u1514 \u1512  \u1513 \u1500 \u1498  \u1500 \u1490 \u1513 \u1514  \u1500 \u1513 \u1512 \u1514  \u1492 \u1494 \u1492 \
\
app.get('/api/alerts', async (req, res) => \{\
  try \{\
    const response = await axios.get('[https://www.oref.org.il/WarningMessages/alert/alerts.json](https://www.oref.org.il/WarningMessages/alert/alerts.json)', \{\
      headers: \{\
        'Referer': '[https://www.oref.org.il/](https://www.oref.org.il/)',\
        'X-Requested-With': 'XMLHttpRequest',\
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'\
      \}\
    \});\
    \
    // \uc0\u1488 \u1501  \u1488 \u1497 \u1503  \u1492 \u1514 \u1512 \u1488 \u1493 \u1514 , \u1508 \u1497 \u1511 \u1493 \u1491  \u1492 \u1506 \u1493 \u1512 \u1507  \u1502 \u1495 \u1494 \u1497 \u1512  \u1491 \u1507  \u1512 \u1497 \u1511  \u1488 \u1493  204\
    if (response.status === 204 || !response.data) \{\
      return res.json(\{ data: [], id: 0 \});\
    \}\
    \
    res.json(response.data);\
  \} catch (error) \{\
    res.status(500).json(\{ error: 'Failed to fetch from Oref' \});\
  \}\
\});\
\
const PORT = process.env.PORT || 3001;\
app.listen(PORT, () => console.log(`Proxy server running on port $\{PORT\}`));}