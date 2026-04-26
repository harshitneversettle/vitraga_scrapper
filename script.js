const { default: axios } = require("axios");

async function temp() {
  const res = await axios.get(
    "https://api.metals.dev/v1/latest?api_key=OWM3XID5NOCI3C0PE2021070PE202&currency=USD&unit=toz",
    {
      // headers: {
      //   "x-access-token": "goldapi-ddb996ce90353fe7c19638b10340238a-io",
      //   "content-type": "application/json",
      // },
    },
  );

  // console.log(res.data.chart.result[0]);
  console.log(res.data) ;
}
temp();
