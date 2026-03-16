var vm = new Vue({
    el: '#app',
    data() {
        return {
            disabled: true,
            showCate: false,
            type: 'null',
            detail: {},
            footer: '',
            gameChannelId: 0,
            allCategories: [{
                name: 'Home',
                id: 15
            },
            {
                name: 'Beauty',
                id: 1
            },
            {
                name: 'Puzzle',
                id: 2
            },
            {
                name: 'Sports',
                id: 4
            },
            {
                name: 'New',
                id: 5
            },
            {
                name: 'Action',
                id: 8
            },
            {
                name: 'Best',
                id: 14
            },
            {
                name: 'Racing',
                id: 3
            },
            {
                name: 'Adventure',
                id: 6
            },
            {
                name: 'Strategy',
                id: 7
            },
            {
                name: 'Arcade',
                id: 9
            },
            {
                name: 'Shooting',
                id: 10
            },
            {
                name: 'Simulation',
                id: 11
            },
            {
                name: 'RPG',
                id: 12
            },
            {
                name: 'Casual',
                id: 13
            },
            ]
        }
    },
    computed: {
        mainCategories() {
            return this.allCategories.slice(0, 7) 
        },
        // PC
        moreCategories() {
            return this.allCategories.slice(7) // 
        },
        // 
        categories() {
            return this.allCategories
        }
    },
    created() {
        this.getDetail()
    },
    mounted() {
        // 
        this.$nextTick(() => {
            this.init();
            // 
            this.$el.removeAttribute('v-cloak');
        });
    },
    methods: {
        init() {
            this.footer = useFooter()
            window.addEventListener("scroll", debounce(handleScroll, 500), true)
            this.type = getQueryVariable('type') ? getQueryVariable('type') : null
        },
        handleToPlay() {
            return `play.html?gameChannelId=${this.gameChannelId}&gameFileName=${this.detail.gameFileName}`
        },
        getDetail() {
            const gameId = getQueryVariable('gameId') ? getQueryVariable('gameId') : 1506
            axios({
                method: "post",
                url: "https://www.migame.vip/gamefront/gameList/tempGameDetails",
                data: {
                    gameChannelId: this.gameChannelId,
                    gameId
                }
            }).then(res => {
                this.detail = res.data.data
                this.disabled = false
                this.gameSrc =
                    `https://www.datinginfo.top/game/index.html?gameFileName=${this.detail.gameFileName}/`
                // 
                if (this.detail.gameName) {
                    document.title = this.detail.gameName + ' - h5gamelist'
                }
                // 
                this.saveGameHistory({
                    gameId: gameId,
                    gameName: this.detail.gameName,
                    gameLogo: this.detail.gameLogo,
                    gameFileName: this.detail.gameFileName,
                    timestamp: Date.now()
                })
                this.$nextTick(() => {
                    handleScroll()
                })
            })
        },
        saveGameHistory(game) {
            try {
                let history = JSON.parse(localStorage.getItem('gameHistory') || '[]')
                // 
                history = history.filter(item => item.gameId !== game.gameId)
                // 
                history.unshift(game)
                // 
                history = history.slice(0, 50)
                localStorage.setItem('gameHistory', JSON.stringify(history))
            } catch (e) {
                console.error('Failed to save game history:', e)
            }
        },
        handleToType({
            id,
            name
        }) {
            return `type.html?type=${id}&typeName=${name}&gameChannelId=${this.gameChannelId}`;
        },
        handleToDetail(gameId, type) {
            return `detail.html?gameId=${gameId}&gameChannelId=${this.gameChannelId}&type=${type}`
        }
    }
})