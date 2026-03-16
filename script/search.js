var vm = new Vue({
    el: '#app',
    data() {
        return {
            showCate: false,
            searchKeyword: '',
            searchResults: [],
            allGames: [],
            hasSearched: false,
            loading: false,
            footer: '',
            gameChannelId: 0,
            // 所有分类
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
        // PC端主要分类（显示在导航栏）
        mainCategories() {
            return this.allCategories.slice(0, 7) // 前7个作为主要分类
        },
        // PC端更多分类（放入下拉菜单）
        moreCategories() {
            return this.allCategories.slice(7) // 剩余的放入More菜单
        },
        // 移动端显示所有分类
        categories() {
            return this.allCategories
        }
    },
    created() {
        // 从URL获取gameChannelId
        const gameChannelIdParam = getQueryVariable('gameChannelId')
        if (gameChannelIdParam) {
            this.gameChannelId = parseInt(gameChannelIdParam, 10) || 0
        }
        // 从URL获取搜索关键词
        const keywordParam = getQueryVariable('keyword')
        if (keywordParam) {
            this.searchKeyword = decodeURIComponent(keywordParam)
            this.performSearch()
        }
        // 加载所有游戏数据用于搜索
        this.loadAllGames()
    },
    mounted() {
        // 确保Vue渲染完成后移除v-cloak并显示导航
        this.$nextTick(() => {
            this.init();
            // 强制移除v-cloak属性
            this.$el.removeAttribute('v-cloak');
        });
    },
    methods: {
        init() {
            this.footer = useFooter()
            window.addEventListener("scroll", debounce(handleScroll, 500), true)
            document.title = 'Search Games - h5gamelist'
        },
        // 加载所有分类的游戏数据
        loadAllGames() {
            const storageKey = 'allGames_cache'
            const cacheExpiry = 24 * 60 * 60 * 1000 // 24小时过期

            // 检查localStorage中是否有缓存
            const cached = localStorage.getItem(storageKey)
            if (cached) {
                try {
                    const cacheData = JSON.parse(cached)
                    const now = Date.now()
                    // 如果缓存未过期，直接使用
                    if (cacheData.timestamp && (now - cacheData.timestamp < cacheExpiry)) {
                        this.allGames = cacheData.data || []
                        return
                    }
                } catch (e) {
                    console.error('Failed to parse cached all games:', e)
                }
            }

            // 并行请求所有分类的游戏
            const categoryIds = this.allCategories.map(cat => cat.id)
            const promises = categoryIds.map(categoryId => {
                return axios({
                    method: 'post',
                    url: 'https://www.migame.vip/gamefront/gameList/SelectGameByGameType',
                    data: {
                        gameTypeId: categoryId,
                        page: 1,
                        limit: 100  // 每个分类加载100个游戏用于搜索
                    }
                }).then(res => {
                    return res.data.data || []
                }).catch(err => {
                    console.error(`Failed to load games for category ${categoryId}:`, err)
                    return []
                })
            })

            Promise.all(promises).then(results => {
                // 合并所有游戏，去重（基于gameId）
                const gamesMap = new Map()
                results.forEach(games => {
                    games.forEach(game => {
                        if (game.gameId && !gamesMap.has(game.gameId)) {
                            gamesMap.set(game.gameId, game)
                        }
                    })
                })
                this.allGames = Array.from(gamesMap.values())

                // 保存到localStorage
                try {
                    localStorage.setItem(storageKey, JSON.stringify({
                        data: this.allGames,
                        timestamp: Date.now()
                    }))
                } catch (e) {
                    console.error('Failed to save all games to localStorage:', e)
                }
            })
        },
        // 执行搜索
        performSearch() {
            if (!this.searchKeyword || this.searchKeyword.trim() === '') {
                return
            }

            this.hasSearched = true
            const keyword = this.searchKeyword.trim().toLowerCase()

            // 更新URL参数
            const url = new URL(window.location.href)
            url.searchParams.set('keyword', encodeURIComponent(this.searchKeyword))
            window.history.pushState({}, '', url)

            // 从所有游戏中搜索
            this.searchResults = this.allGames.filter(game => {
                if (!game.gameName) return false
                return game.gameName.toLowerCase().includes(keyword)
            })

            // 如果本地数据中没有找到，尝试从API搜索
            if (this.searchResults.length === 0 && this.allGames.length > 0) {
                this.searchFromAPI(keyword)
            } else {
                this.$nextTick(() => {
                    handleScroll()
                })
            }
        },
        // 从API搜索
        searchFromAPI(keyword) {
            if (this.loading) return
            this.loading = true

            // 尝试搜索所有分类
            const categoryIds = this.allCategories.map(cat => cat.id)
            const promises = categoryIds.map(categoryId => {
                return axios({
                    method: 'post',
                    url: 'https://www.migame.vip/gamefront/gameList/SelectGameByGameType',
                    data: {
                        gameTypeId: categoryId,
                        page: 1,
                        limit: 50
                    }
                }).then(res => {
                    const games = res.data.data || []
                    return games.filter(game => {
                        if (!game.gameName) return false
                        return game.gameName.toLowerCase().includes(keyword)
                    })
                }).catch(err => {
                    console.error(`Failed to search games for category ${categoryId}:`, err)
                    return []
                })
            })

            Promise.all(promises).then(results => {
                // 合并搜索结果，去重
                const gamesMap = new Map()
                results.forEach(games => {
                    games.forEach(game => {
                        if (game.gameId && !gamesMap.has(game.gameId)) {
                            gamesMap.set(game.gameId, game)
                        }
                    })
                })
                this.searchResults = Array.from(gamesMap.values())
                this.loading = false

                this.$nextTick(() => {
                    handleScroll()
                })
            }).catch(err => {
                console.error('Failed to search games:', err)
                this.loading = false
            })
        },
        handleToType(category) {
            if (typeof category === 'object') {
                return `type.html?type=${category.id}&typeName=${category.name}&gameChannelId=${this.gameChannelId}`;
            }
            const cat = this.allCategories.find(c => c.name === category || c.id === category)
            if (cat) {
                return `type.html?type=${cat.id}&typeName=${cat.name}&gameChannelId=${this.gameChannelId}`;
            }
            return '#'
        },
        handleToDetail(gameId, type) {
            return `detail.html?gameId=${gameId}&gameChannelId=${this.gameChannelId}&type=${type}`
        }
    }
})