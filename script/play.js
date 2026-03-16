 var vm = new Vue({
    el: "#App",
    data: {
      gameFileName: "gulaodekuangshi",
      gameChannelId: 0,

      mask: true,
      show: true,
      poster: "",
      poster2: "",
      poster3: "",
      poster4: "",
      poster5: "",
      poster6: "",
      count: "",
      totalTime: 5,
    },
    methods: {
      getQueryVariable(variable) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
          var pair = vars[i].split("=");
          if (pair[0] == variable) {
            return pair[1];
          }
        }
        return (false);
      },
      handleBackHome() {
        window.history.back()
      },
      countDown() {
        let clock = setInterval(() => {
          this.totalTime--;
          this.count = this.totalTime + "s Can be closed";
          if (this.totalTime <= 0) {
            clearTimeout(clock);
            this.count = "Play";
            setTimeout(() => {
              this.mask = false
            }, 2000)
          }
        }, 1000);
      },
      close() {
        if (this.totalTime == 0) {
          this.mask = false;
        }
      },
      getPoster() {
        axios({
          method: 'post',
          url: 'https://www.migame.vip/gamefront/gameAd/getHomeAdListVo',
          data: {
            gameChannelId: this.gameChannelId,
            gameSceneId: 3
          }
        }).then(res => {
          for (let index = 0; index < res.data.data.length; index++) {
            switch (res.data.data[index].adPositionId) {
              case 3:
                const str = res.data.data[index].gcJs
                if (str.indexOf("ins") !== -1) {
                  this.poster = str.match(/<ins.*?\/ins>/g)[0];
                  this.poster2 = str.match(/<script.*?\/script>/g)[0].split('>')[
                    1].split('<')[0];
                  setTimeout(() => {
                    var ele = document.createElement('script')
                    ele.innerHTML = this.poster2
                    this.$refs.poster.append(ele)
                  }, 16)
                } else {
                  this.poster = str.slice(str.indexOf('<div'), str.indexOf(
                    ";'>")) + "'>" + str.slice(str.indexOf('</div'))
                  this.poster2 = str.split("<script>")[1].split("</s")[0];
                  this.poster3 = str.split("<script>")[2].split("</s")[0];
                  setTimeout(() => {
                    var ele = document.createElement("script");
                    ele.innerHTML = this.poster2;
                    this.$refs.poster.append(ele);
                    var ele2 = document.createElement("script");
                    ele2.innerHTML = this.poster3;
                    this.$refs.poster.append(ele2);
                  }, 16);
                }
                break;

              case 2:
                const str2 = res.data.data[index].gcJs
                if (str2.indexOf("ins") !== -1) {
                  this.poster4 = str2.match(/<ins.*?\/ins>/g)[0];
                  this.poster5 = str2.match(/<script.*?\/script>/g)[0].split('>')[
                    1].split('<')[0];
                  setTimeout(() => {
                    var ele = document.createElement('script')
                    ele.innerHTML = this.poster5
                    this.$refs.topAd.append(ele)
                  }, 16)
                } else {
                  this.poster4 = str2.slice(str2.indexOf('<div'), str2.indexOf(
                    ";'>")) + "'>" + str2.slice(str2.indexOf('</div'))
                  this.poster5 = str2.split("<script>")[1].split("</s")[0];
                  this.poster6 = str2.split("<script>")[2].split("</s")[0];
                  setTimeout(() => {
                    var ele = document.createElement("script");
                    ele.innerHTML = this.poster5;
                    this.$refs.topAd.append(ele);
                    var ele2 = document.createElement("script");
                    ele2.innerHTML = this.poster6;
                    this.$refs.topAd.append(ele2);
                  }, 16);
                }
                break;

              default:
                break;
            }
          }
        })
      },
    },
    mounted() {
      this.getQueryVariable("gameFileName") !== false ? this.gameFileName = this.getQueryVariable("gameFileName") :
        ""
      // this.countDown()
      // this.getPoster()
    }
  })