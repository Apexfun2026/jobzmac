var vm = new Vue({
    el: '#app',
    data() {
        return {
            showCate: false,
            title: 'Popular',
            list: [],
            currentPage: 1,
            pageSize: 20,
            totalPages: 1,
            loading: false,
            footer: '',
            gameChannelId: 0,
            currentLanguage: localStorage.getItem('language') || 'en',
            languages: [
                { code: 'en', name: 'English' },
                { code: 'zh', name: '中文' }
            ],
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
        this.getList()
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
            document.title = 'Popular Games - h5gamelist'
        },
        getList(page = 1) {
            if (this.loading) return
            this.loading = true
            const storageKey = `popularGames_page_${page}`
            const cacheExpiry = 24 * 60 * 60 * 1000 // 24小时过期

            // 检查localStorage中是否有缓存
            if (page === 1) {
                const cached = localStorage.getItem(storageKey)
                if (cached) {
                    try {
                        const cacheData = JSON.parse(cached)
                        const now = Date.now()
                        // 如果缓存未过期，直接使用
                        if (cacheData.timestamp && (now - cacheData.timestamp < cacheExpiry)) {
                            this.list = cacheData.data || []
                            this.totalPages = cacheData.totalPages || 1
                            this.currentPage = page
                            this.loading = false
                            this.$nextTick(() => {
                                handleScroll()
                            })
                            return
                        }
                    } catch (e) {
                        console.error('Failed to parse cached popular games:', e)
                    }
                }
            }

            axios({
                method: 'post',
                url: 'https://www.migame.vip/gamefront/gameList/SelectGameByGameType',
                data: {
                    gameTypeId: 5,  // New类型作为热门游戏
                    page: page,
                    limit: this.pageSize
                }
            }).then(res => {
                const newGames = res.data.data || []
                this.list = newGames
                this.currentPage = page

                // 计算总页数
                if (newGames.length < this.pageSize) {
                    this.totalPages = page
                } else {
                    this.totalPages = Math.max(this.totalPages, page + 1)
                }

                // 保存到localStorage（只缓存第一页）
                if (page === 1) {
                    try {
                        localStorage.setItem(storageKey, JSON.stringify({
                            data: newGames,
                            totalPages: this.totalPages,
                            timestamp: Date.now()
                        }))
                    } catch (e) {
                        console.error('Failed to save popular games to localStorage:', e)
                    }
                }

                this.loading = false
                this.$nextTick(() => {
                    handleScroll()
                })
            }).catch(err => {
                console.error('Failed to load popular games:', err)
                this.loading = false
            })
        },
        goToPage(page) {
            if (page < 1 || page > this.totalPages || this.loading) return
            this.getList(page)
            // 滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' })
        },
        getPageNumbers() {
            // 生成页码数组，限制显示数量
            const pages = []
            const maxVisible = 5 // 最多显示5个页码

            if (this.totalPages <= maxVisible) {
                // 如果总页数不超过5页，显示所有页码
                for (let i = 1; i <= this.totalPages; i++) {
                    pages.push(i)
                }
            } else {
                // 如果总页数超过5页，只显示部分页码
                const current = this.currentPage
                const total = this.totalPages

                // 总是显示首页
                pages.push(1)

                // 计算显示范围
                let start = Math.max(2, current - 1)
                let end = Math.min(total - 1, current + 1)

                // 如果当前页靠近首页，调整结束位置
                if (current <= 2) {
                    end = Math.min(4, total - 1)
                }

                // 如果当前页靠近末页，调整开始位置
                if (current >= total - 1) {
                    start = Math.max(2, total - 3)
                }

                // 如果开始位置不是2，添加省略号
                if (start > 2) {
                    pages.push('...')
                }

                // 添加中间页码
                for (let i = start; i <= end; i++) {
                    pages.push(i)
                }

                // 如果结束位置不是末页前一个，添加省略号
                if (end < total - 1) {
                    pages.push('...')
                }

                // 总是显示末页
                pages.push(total)
            }

            return pages
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