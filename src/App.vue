<template>
  <div id="app">
    <div id="tipTop" v-if="isLongTap">
      <div class="left">全部消息</div>
      <button class="right" @click="isLongTap = false">取消</button>
    </div>
    <div
      id="msgHolder"
      :class="[isLongTap ? 'shortened' : 'normal']"
      v-loading="loading"
      ref="msgHolder"
      @scroll="reachBottom"
    >
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="item"
        @touchstart="userTouchStart"
        @touchend="userTouchEnd"
      >
        <div class="header">
          <div
            class="holder"
            :style="{ paddingRight: msg.is_read ? '0' : '40px' }"
          >
            <div :class="['title', msg.showDetail ? '' : 'ellipsis-one']">
              {{ msg.title }}
            </div>
            <div class="unread" v-if="isQnhdMsg && !msg.is_read">未读</div>
          </div>
          <div class="more-holder" v-if="isQnhdMsg && !isLongTap">
            <button class="more" @click="handleClickMore(msg)">
              <img src="./assets/more.svg" alt="..." class="icon" />
            </button>
            <div id="tip" v-show="msg.showTip" @click="deleteMsg([msg.id])">
              <div class="delete">删除</div>
            </div>
          </div>
          <div class="more-holder" v-else-if="isQnhdMsg">
            <button
              class="batch"
              @click="msg.is_chosen = !msg.is_chosen"
              :style="{
                backgroundColor: msg.is_chosen ? '#363c54' : '#f7f7f8',
              }"
            >
              <img
                src="./assets/correct.svg"
                alt="√"
                class="icon"
                v-show="msg.is_chosen"
              />
            </button>
          </div>
        </div>
        <div class="timestamp">{{ timeFromNow(msg.created_at) }}</div>
        <div class="content-holder">
          <div
            class="content"
            v-show="msg.showDetail"
            :style="{ flex: msg.showDetail ? '1' : '0' }"
          >
            <mavon-editor
              v-model="msg.content"
              :toolbarsFlag="false"
              :subfield="false"
              defaultOpen="preview"
              :boxShadow="false"
              previewBackground="#ffffff"
            />
          </div>
          <div class="content modify" v-show="!msg.showDetail">
            <div class="ellipsis-two" v-html="msg.cut"></div>
          </div>
          <div v-if="!msg.showDetail" style="flex: 1"></div>
          <div class="additional">
            <div
              class="sender"
              :style="{
                fontWeight: isQnhdMsg ? '400' : 'bold',
                color: isQnhdMsg ? '#6c6c6c' : 'black',
              }"
            >
              <div v-if="isQnhdMsg">来自</div>
              <img
                src="https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fblog.tsyzz.com%2Fupload%2F2016%2F0525%2F0156061529.png&refer=http%3A%2F%2Fblog.tsyzz.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1645766520&t=f5b635f791a4727dfadad840d5cc2875"
                alt="logo"
                v-else
              />
              <div style="margin-left: 5px">{{ msg.sender }}</div>
            </div>
            <button class="detail" @click="handleUnfold(msg)">
              <img
                src="./assets/fold.svg"
                :class="['icon', msg.showDetail ? '' : 'rotate']"
                alt=">>"
              />
              {{ msg.showDetail ? "收起" : "展开" }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div id="tipBottom" v-if="isLongTap">
      <div class="left">
        <button
          class="batch"
          @click="handleChooseAll"
          :style="{
            backgroundColor: is_all_chosen ? '#363c54' : '#f7f7f8',
          }"
        >
          <img
            src="./assets/correct.svg"
            alt="√"
            class="icon"
            v-show="is_all_chosen"
          />
        </button>
        全选
      </div>
      <button class="right" @click="handleDeletes">删除</button>
    </div>
    <router-view />
    <div id="noData" v-if="showNoMsgTip">
      {{ isQnhdMsg ? "暂无湖底通知" : "暂无部门公告" }}
    </div>
    <div id="globalTip" v-if="globalTip">{{ globalTip }}</div>
  </div>
</template>
<script>
import { marked } from "marked";
var renderer = new marked.Renderer();
marked.setOptions({
  renderer,
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
});
export default {
  data() {
    return {
      messages: [],
      msgTemp: {
        id: 0,
        created_at: "2022-04-17T20:04:20.921747+08:00",
        sender: "湖底管理员",
        title: "您的帖子因违反社区规范已被处理，请您",
        content:
          "### Compiles and hot-reloads for development\n```\nnpm run serve\n```\n### Compiles and minifies for production\n```\nnpm run build\n```\n### Lints and fixes files\n```\nnpm run lint\n```\n### Customize configuration\nSee [Configuration Reference](https://cli.vuejs.org/config/).<img src='https://t7.baidu.com/it/u=2291349828,4144427007&fm=193&f=GIF' />", // markdown
        // symbol: "post_deleted_by_report",
        is_read: false,
      },
      pageForMsgs: 1,
      total: 0,
      timeOutEvent: 0,
      isLongTap: false,
      is_all_chosen: false,
      globalTip: "",
      showNoMsgTip: false,
      loading: false,
    };
  },
  mounted() {
    this.$store.commit("setType", this.$route.query.type);
    this.getMessages();
  },
  computed: {
    getUrlToken() {
      return this.$route.query.token;
    },
    isQnhdMsg() {
      return this.$store.state.type === "default";
    },
  },
  methods: {
    getMessages() {
      var url = this.isQnhdMsg
        ? "/message/notices"
        : "message/notices/department";
      this.$request
        .get(url, {
          page: this.pageForMsgs,
          page_size: 10,
        })
        .then((res) => {
          console.log(res);
          if (res.code === 200) {
            if (res.data.list.length) {
              var add = [];
              res.data.list.forEach((msg) => {
                add.push({
                  id: msg.id,
                  title: msg.title,
                  sender: msg.sender,
                  content: msg.content,
                  cut: this.contentPreview(msg.content),
                  symbol: msg.symbol,
                  created_at: msg.created_at,
                  is_read: this.isQnhdMsg ? msg.is_read : true,
                  showTip: false,
                  showDetail: false,
                  is_chosen: false,
                });
              });
              this.messages = [...this.messages, ...add];
            }
            this.total = res.data.total;
            if (this.messages == false) this.showNoMsgTip = true;
            this.loading = false;
          } else if (res.code === 20001) {
            this.loading = false;
            this.refreshToken();
          }
        });
    },
    reachBottom() {
      const dom = this.$refs.msgHolder;
      if (dom.scrollTop === dom.scrollHeight - dom.offsetHeight) {
        console.log("到底部了");
        if (this.messages.length == this.pageForMsgs * 10) {
          this.pageForMsgs++;
          this.getMessages();
        } else {
          this.globalTip = "No More Data";
          setTimeout(() => {
            this.globalTip = "";
          }, 1000);
        }
      }
    },
    msgNewSearch() {
      this.loading = true;
      this.messages = [];
      this.pageForMsgs = 1;
      this.getMessages();
    },
    handleClickMore(msg) {
      if (msg.showTip) msg.showTip = false;
      else {
        for (var i = 0; i < this.total; i++)
          if (this.messages[i].showTip) {
            this.messages[i].showTip = false;
            break;
          }
        msg.showTip = true;
      }
    },
    handleChooseAll() {
      if (!this.is_all_chosen)
        this.messages.forEach((msg) => {
          msg.is_chosen = true;
        });
      else
        this.messages.forEach((msg) => {
          msg.is_chosen = false;
        });
      this.is_all_chosen = !this.is_all_chosen;
    },
    deleteMsg(arr) {
      this.$request
        .get(`/message/notices/delete${this.arrToStr(arr)}`, {})
        .then((res) => {
          if (res.code === 200)
            setTimeout(() => {
              this.msgNewSearch();
            }, 500);
        });
    },
    handleDeletes() {
      var id_arr = [];
      for (let i = 0; i < this.messages.length; i++) {
        if (this.messages[i].is_chosen) id_arr.push(this.messages[i].id);
      }
      if (!id_arr.length) {
        this.globalTip = "删除内容为空";
        setTimeout(() => {
          this.globalTip = "";
        }, 1000);
        return;
      }
      this.$request
        .get(`/message/notices/delete${this.arrToStr(id_arr)}`, {})
        .then((res) => {
          if (res.code === 200)
            setTimeout(() => {
              this.isLongTap = false;
              this.msgNewSearch();
            }, 500);
        });
    },
    arrToStr(arr) {
      let str = "?";
      for (let i = 0; i < arr.length; i++) {
        str += "ids=" + arr[i] + "&";
      }
      return str;
    },
    handleUnfold(msg) {
      msg.showDetail = !msg.showDetail;
      if (this.isQnhdMsg && !msg.is_read) {
        let formData = new FormData();
        formData.append("id", msg.id);
        let config = {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        };
        this.$request
          .post("/message/notice/read", formData, config)
          .then((res) => {
            if (res.code === 200) msg.is_read = true;
          });
      }
    },
    userTouchStart() {
      if (this.isQnhdMsg) {
        this.timeOutEvent = setTimeout(() => {
          this.timeOutEvent = 0;
          //真正长按后应该执行的内容
          this.is_all_chosen = false;
          this.isLongTap = true;
          console.log("长按事件触发");
        }, 500); //这里设置定时器，定义长按500毫秒触发长按事件，时间可以自己改，个人感觉500毫秒非常合适
        return false;
      }
    },
    // userTouchMove() {
    //   clearTimeout(this.timeOutEvent); //清除定时器
    //   this.timeOutEvent = 0;
    //   this.isLongTap = false;
    //   console.log("取消了");
    // },
    userTouchEnd() {
      if (this.isQnhdMsg) {
        clearTimeout(this.timeOutEvent); //清除定时器
        if (this.timeOutEvent !== 0) {
          //这里写要执行的内容（尤如onclick事件）
          console.log("你这是点击，不是长按");
        }
        return false;
      }
    },
    contentPreview(content) {
      var reg_p = /<p>(.*?)<\/p>/g,
        reg_img = /<img(.*?)>/g,
        reg_img_alt = /alt=\\"(.*?)\\">/g,
        reg_a = /<a(.*?)<\/a>/g,
        reg_a_tex = />(.*?)</g,
        reg_br = /\\n/g;
      let _html = marked(content);
      let _str = JSON.stringify(_html).match(reg_p);
      let result = "";

      if (_str == null) result = "展开查看详情...";
      else
        for (let i = 0; i < _str.length; i++) {
          let imgs = _str[i].match(reg_img);
          let links = _str[i].match(reg_a);
          console.log(imgs, links);
          if (imgs != null)
            for (let j = 0; j < imgs.length; j++) {
              let alt = "[图片] " + imgs[j].match(reg_img_alt)[0].slice(6, -3);
              _str[i] = _str[i].replace(imgs[j], alt);
            }
          if (links != null)
            for (let k = 0; k < links.length; k++) {
              let tex = "[链接] " + links[k].match(reg_a_tex)[0].slice(1, -1);
              _str[i] = _str[i].replace(links[k], tex);
            }
          _str[i] = _str[i].replace(reg_br, "<br/>");
          result += _str[i];
        }
      return result;
    },
    returnCompleteTime(date) {
      return (
        date.getFullYear() +
        "-" +
        (date.getMonth() + 1) +
        "-" +
        (`${date.getDate() < 10 ? "0" : ""}` + date.getDate()) +
        " " +
        (`${date.getHours() < 10 ? "0" : ""}` + date.getHours()) +
        ":" +
        (`${date.getMinutes() < 10 ? "0" : ""}` + date.getMinutes()) +
        ":" +
        (`${date.getSeconds() < 10 ? "0" : ""}` + date.getSeconds())
      );
    },
    timeFromNow(inputTime) {
      let now = new Date(),
        past = new Date(inputTime);
      let gap = now.getTime() - past.getTime();
      let dDays = Math.floor(gap / (24 * 3600 * 1000));
      let residue1 = gap % (24 * 3600 * 1000);
      let dHours = Math.floor(residue1 / (3600 * 1000));
      let residue2 = residue1 % (3600 * 1000);
      let dMinutes = Math.floor(residue2 / (60 * 1000));
      let residue3 = residue2 % (60 * 1000);
      let dSeconds = Math.round(residue3 / 1000);
      return dDays > 0
        ? this.returnCompleteTime(past)
        : dHours > 0
        ? `${dHours}小时${dMinutes}分钟前`
        : dMinutes > 0
        ? `${dMinutes}分钟前`
        : `${dSeconds}秒前`;
    },
    refreshToken() {
      this.$request.get(`/auth/${this.getUrlToken}`, {}).then((res) => {
        if (res.code === 200) {
          this.$store.commit("setToken", res.data.token);
          setTimeout(() => {
            this.msgNewSearch();
          }, 100);
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
#msgHolder {
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: scroll;
}
#msgHolder::-webkit-scrollbar {
  display: none !important;
}
.shortened {
  height: calc(100vh - 60px);
  margin-top: 30px;
}
.normal {
  height: 100vh;
}
button {
  border: none;
  outline: none;
}
.ellipsis-one {
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}
.ellipsis-two {
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.item {
  * {
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  }
  width: calc(100% - 32px);
  min-height: 160px;
  margin: 10px 16px;
  padding: 16px;
  box-sizing: border-box;
  background-color: white;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  transform: scale(1);
  .header {
    display: flex;
    align-items: center;
    .holder {
      flex: 1;
      display: flex;
      transform: scale(1);
      .title {
        font-size: 16px;
        line-height: 23px;
        font-weight: bold;
        color: #000000;
        word-break: break-all;
      }
      .unread {
        width: 37px;
        position: fixed;
        top: 50%;
        transform: translateY(-50%) scale(0.85);
        right: 0;
        background-color: #363c54;
        color: white;
        font-size: 13px;
        text-align: center;
        padding: 2.5px 0;
        border-radius: 6px;
      }
    }
    .more-holder {
      width: 30px;
      display: flex;
      align-items: center;
      .more {
        width: 21px;
        height: 21px;
        margin-left: 9px;
        border-radius: 50%;
        background-color: #f7f7f8;
        cursor: pointer;
        .icon {
          width: 22px;
          height: 22px;
          transform: translate(-0.5px, -0.5px);
        }
      }
      .batch {
        width: 21px;
        height: 21px;
        margin-left: 9px;
        border-radius: 50%;
        border: 1px solid #6c6c6c;
        cursor: pointer;
        .icon {
          width: 21px;
          height: 21px;
          transform: scale(0.7) translateX(-2px);
        }
      }
    }
  }
  #tip {
    position: fixed;
    top: 45px;
    right: 16px;
    width: 65px;
    padding: 8px 0;
    border-radius: 10px;
    background-color: white;
    box-shadow: 0px 0px 2px #6c6c6c;
    font-size: 13px;
    text-align: center;
    transition: all 0.2s;
    z-index: 2 !important;
    .delete {
      width: 65px;
    }
    .division {
      width: 80%;
      height: 0.5px;
      border-radius: 0.5px;
      margin: 4px auto;
      background-color: #dddddd;
    }
  }
  .timestamp {
    margin: 3px 0;
    font-weight: 400;
    font-size: 12px;
    line-height: 17px;
    color: #6c6c6c;
  }
  .content-holder {
    flex: 1;
    box-sizing: border-box;
    border-radius: 5px;
    font-weight: 500;
    font-size: 13px;
    line-height: 19px;
    display: flex;
    flex-direction: column;
    .content {
      margin: auto -16px;
      line-height: 20px;
      height: 40px;
      overflow: hidden;
    }
    .modify {
      margin: 8px 0 0 0;
    }
    .additional {
      margin-top: 5px;
      display: flex;
      justify-content: space-between;
      .sender {
        font-size: 12px;
        line-height: 17px;
        display: flex;
        align-items: center;
        img {
          width: 25px;
          height: 25px;
          transform: scale(1.1);
          z-index: -1 !important;
        }
      }
      .detail {
        color: #0366d6;
        margin-right: 10px;
        border: none;
        outline: none;
        background: none;
        font-size: 12px;
        display: flex;
        align-items: center;
        .icon {
          width: 18px;
          height: 18px;
          margin-right: 5px;
        }
        .rotate {
          transform: rotate(180deg);
        }
      }
    }
  }
}
#tipTop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}
#tipBottom {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}
#tipTop,
#tipBottom {
  .left {
    padding: 0 20px;
    display: flex;
    .batch {
      width: 21px;
      height: 21px;
      border-radius: 50%;
      border: 1px solid #6c6c6c;
      cursor: pointer;
      margin-right: 8px;
      .icon {
        width: 21px;
        height: 21px;
        transform: scale(0.7) translateX(-2px);
      }
    }
  }
  .right {
    padding: 0 18px;
    color: red;
    line-height: 30px;
    border: none;
    outline: none;
    background-color: transparent;
  }
}
#noData {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  font-size: 14px;
  text-align: center;
}
#globalTip {
  position: fixed;
  width: 100px;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  font-size: 14px;
  text-align: center;
  border-radius: 15px;
  padding: 6px 10px;
}
</style>
<style>
p {
  font-size: 13px !important;
}
.v-note-wrapper {
  z-index: 0 !important;
  border: none !important;
  font-size: 14px;
  min-width: 100px !important;
}
.v-show-content {
  padding: 8px 16px !important;
}
.v-note-img-wrapper {
  background: rgba(247, 247, 247, 0.75) !important;
  backdrop-filter: blur(8px);
}
</style>
