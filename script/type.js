var vm = new Vue({
    el: '#app',
    data() {
        return {
            showCate: false,
            title: '',
            type: 'null',
            list: [],
            currentPage: 1,
            pageSize: 20,
            totalPages: 1,
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
        console.log('Vue instance created')
        // 先初始化，然后加载数据
        this.init()
        console.log('Init completed, calling getList')
        this.getList()
    },
    mounted() {
        // 确保Vue渲染完成后移除v-cloak并显示导航
        this.$nextTick(() => {
            // 强制移除v-cloak属性
            this.$el.removeAttribute('v-cloak');
        });
    },
    methods: {
        init() {
            console.log('=== Init method called ===')
            this.footer = useFooter()
            window.addEventListener("scroll", debounce(handleScroll, 500), true)
            this.title = getQueryVariable('typeName') ? getQueryVariable('typeName') : ''
            console.log('Title from URL:', this.title)
            // 更新浏览器标题为分类名称
            if (this.title) {
                document.title = this.title + ' - h5gamelist'
            }
            // 从URL读取页码
            const pageParam = getQueryVariable('page')
            console.log('Page param from URL:', pageParam)
            if (pageParam) {
                const page = parseInt(pageParam, 10)
                if (page > 0) {
                    this.currentPage = page
                    console.log('Set currentPage to:', this.currentPage)
                }
            }
            console.log('=== Init completed ===')
        },
        getList(page = null) {
            console.log('getList called with page:', page)
            if (this.loading) {
                console.log('Already loading, skipping')
                return
            }
            this.loading = true
            // 如果没有指定页码，从URL或当前页获取
            if (page === null) {
                const pageParam = getQueryVariable('page')
                page = pageParam ? parseInt(pageParam, 10) : (this.currentPage || 1)
            }
            const typeParam = getQueryVariable('type')
            const type = typeParam ? parseInt(typeParam, 10) : 9
            console.log('Loading games for type:', type, 'page:', page)
            const storageKey = `gameList_${type}_page_${page}`
            const cacheExpiry = 24 * 60 * 60 * 1000 // 24小时过期

            // 检查localStorage中是否有缓存（所有页面都支持缓存）
            const cached = localStorage.getItem(storageKey)
            if (cached) {
                console.log('Found cache in localStorage for page', page)
                try {
                    const cacheData = JSON.parse(cached)
                    const now = Date.now()
                    const cacheAge = now - (cacheData.timestamp || 0)
                    console.log('Cache age:', cacheAge, 'ms, expiry:', cacheExpiry, 'ms')
                    // 如果缓存未过期，直接使用
                    if (cacheData.timestamp && (cacheAge < cacheExpiry)) {
                        console.log('Using cached data. Games count:', (cacheData.data || []).length, 'Total pages:', cacheData.totalPages)
                        this.list = cacheData.data || []
                        this.totalPages = cacheData.totalPages || 1
                        this.currentPage = page
                        this.loading = false
                        console.log('Current page:', this.currentPage, 'Total pages:', this.totalPages, 'Games count:', this.list.length)
                        console.log('Should show pagination:', this.totalPages > 1)
                        this.$nextTick(() => {
                            handleScroll()
                        })
                        return
                    } else {
                        console.log('Cache expired, fetching from API')
                    }
                } catch (e) {
                    console.error('Failed to parse cached game list:', e)
                }
            } else {
                console.log('No cache found, fetching from API')
            }

            axios({
                method: 'post',
                url: 'https://www.migame.vip/gamefront/gameList/SelectGameByGameType',
                data: {
                    gameTypeId: type,
                    page: page,
                    limit: this.pageSize
                }
            }).then(res => {
                console.log('API Response for type', type, ':', res.data)
                const newGames = res.data.data || []
                console.log('Games loaded:', newGames.length)

                // 每页只显示该页的游戏，不累积
                this.list = newGames
                // 计算总页数
                this.currentPage = page
                // 如果返回的数据少于pageSize，说明是最后一页
                if (newGames.length < this.pageSize) {
                    this.totalPages = page
                } else {
                    // 如果返回满页，假设还有更多页
                    // 为了确保分页显示，至少设置为当前页+1
                    if (this.totalPages <= page) {
                        this.totalPages = page + 1
                    }
                }

                // 确保totalPages至少为1
                if (this.totalPages < 1) {
                    this.totalPages = 1
                }

                console.log('Current page:', this.currentPage, 'Total pages:', this.totalPages, 'Games count:', newGames.length, 'Page size:', this.pageSize)
                console.log('Should show pagination:', this.totalPages > 1)

                // 保存到localStorage（所有页面都缓存）
                try {
                    localStorage.setItem(storageKey, JSON.stringify({
                        data: newGames,
                        totalPages: this.totalPages,
                        timestamp: Date.now()
                    }))
                } catch (e) {
                    console.error('Failed to save game list to localStorage:', e)
                }

                this.loading = false
                this.$nextTick(() => {
                    handleScroll()
                })
            }).catch(err => {
                console.error('Failed to load games:', err)
                console.error('Request params:', { gameTypeId: type, page: page, limit: this.pageSize })
                this.loading = false
                // 如果加载失败，尝试清空列表
                if (page === 1) {
                    this.list = []
                }
            })
        },
        goToPage(page) {
            console.log('goToPage called with page:', page, 'currentPage:', this.currentPage, 'totalPages:', this.totalPages, 'loading:', this.loading)

            if (this.loading) {
                console.log('Loading in progress, skipping')
                return
            }

            if (page < 1) {
                console.log('Page less than 1, skipping')
                return
            }

            // 如果totalPages还没确定，允许继续（可能是第一页加载中）
            if (this.totalPages > 0 && page > this.totalPages) {
                console.log('Page exceeds totalPages, skipping')
                return
            }

            // 更新URL参数，不刷新页面
            const typeParam = getQueryVariable('type')
            const typeNameParam = getQueryVariable('typeName')
            const gameChannelIdParam = getQueryVariable('gameChannelId')

            const type = typeParam || '9'
            const typeName = typeNameParam || ''
            const gameChannelId = gameChannelIdParam || '0'

            // 构建新的URL
            let newUrl = `type.html?type=${type}&page=${page}`
            if (typeName) {
                newUrl += `&typeName=${encodeURIComponent(typeName)}`
            }
            if (gameChannelId) {
                newUrl += `&gameChannelId=${gameChannelId}`
            }

            console.log('Updating URL to:', newUrl)

            // 更新URL（使用pushState，不刷新页面）
            window.history.pushState({ page: page }, '', newUrl)

            // 更新当前页并加载数据
            this.currentPage = page
            this.getList(page)
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