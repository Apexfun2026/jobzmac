var vm = new Vue({
  el: "#app",
  data() {
    return {
      showCate: false,
      gameData: [],
      popular: [],
      footer: "",
      gameChannelId: 0,
      // 所有分类
      allCategories: [
        {
          name: "Home",
          id: 15,
        },
        {
          name: "Beauty",
          id: 1,
        },
        {
          name: "Puzzle",
          id: 2,
        },
        {
          name: "Sports",
          id: 4,
        },
        {
          name: "New",
          id: 5,
        },
        {
          name: "Action",
          id: 8,
        },
        {
          name: "Best",
          id: 14,
        },
        {
          name: "Racing",
          id: 3,
        },
        {
          name: "Adventure",
          id: 6,
        },
        {
          name: "Strategy",
          id: 7,
        },
        {
          name: "Arcade",
          id: 9,
        },
        {
          name: "Shooting",
          id: 10,
        },
        {
          name: "Simulation",
          id: 11,
        },
        {
          name: "RPG",
          id: 12,
        },
        {
          name: "Casual",
          id: 13,
        },
      ],
    };
  },
  computed: {
    // PC端主要分类（显示在导航栏）
    mainCategories() {
      return this.allCategories.slice(0, 7); // 前7个作为主要分类
    },
    // PC端更多分类（放入下拉菜单）
    moreCategories() {
      return this.allCategories.slice(7); // 剩余的放入More菜单
    },
    // 移动端显示所有分类
    categories() {
      return this.allCategories;
    },
  },
  created() {
    this.loadGameData();
    this.loadPopularGames();
  },
  mounted() {
    // 确保Vue渲染完成后移除v-cloak并显示导航
    this.$nextTick(() => {
      this.init();
      // 强制移除v-cloak属性
      this.$el.removeAttribute("v-cloak");
    });
  },
  methods: {
    init() {
      this.footer = useFooter();
      window.addEventListener("scroll", debounce(handleScroll, 500), true);
      this.$nextTick(handleScroll);
    },
    // 从API加载各分类游戏数据（带localStorage缓存）
    loadGameData() {
      const storageKey = "gameData_cache";
      const cacheExpiry = 24 * 60 * 60 * 1000; // 24小时过期

      // 检查localStorage中是否有缓存
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        try {
          const cacheData = JSON.parse(cached);
          const now = Date.now();
          // 如果缓存未过期，直接使用
          if (cacheData.timestamp && now - cacheData.timestamp < cacheExpiry) {
            this.gameData = cacheData.data || [];
            this.$nextTick(() => {
              handleScroll();
            });
            return;
          }
        } catch (e) {
          console.error("Failed to parse cached game data:", e);
        }
      }
      const categoryIds = [
        { name: "Beauty", id: 1 },
        { name: "Puzzle", id: 2 },
        { name: "Sports", id: 4 },
        { name: "Home", id: 15 },
        { name: "Action", id: 8 },
        { name: "Best", id: 14 },
      ];
      // 并行请求所有分类的游戏
      const promises = categoryIds.map((category) => {
        return axios({
          method: "post",
          url: "https://www.migame.vip/gamefront/gameList/SelectGameByGameType",
          data: {
            gameTypeId: category.id,
            page: 1,
            limit: 20, //每个分类只加载12个游戏用于首页显示
          },
        })
          .then((res) => {
            console.log(res.data);
            return {
              name: category.name,
              games: res.data.data || [],
            };
          })
          .catch((err) => {
            console.error(`Failed to load games for ${category.name}:`, err);
            return {
              name: category.name,
              games: [],
            };
          });
      });
      Promise.all(promises).then((results) => {
        // 所有分类的完整列表（用于查找ID）
        const allCategoriesMap = [
          { name: "Home", id: 15 },
          { name: "Beauty", id: 1 },
          { name: "Puzzle", id: 2 },
          { name: "Sports", id: 4 },
          { name: "New", id: 5 },
          { name: "Action", id: 8 },
          { name: "Best", id: 14 },
          { name: "Racing", id: 3 },
          { name: "Adventure", id: 6 },
          { name: "Strategy", id: 7 },
          { name: "Arcade", id: 9 },
          { name: "Shooting", id: 10 },
          { name: "Simulation", id: 11 },
          { name: "RPG", id: 12 },
          { name: "Casual", id: 13 },
        ];
        // 每个分类只显示12个游戏，并添加分类ID用于More链接
        const gameData = results
          .filter((item) => item.games && item.games.length > 0)
          .map((item) => {
            // 从 allCategoriesMap 中查找分类信息，确保所有分类都有正确的 ID
            const category = allCategoriesMap.find(
              (cat) => cat.name === item.name,
            );
            return {
              name: item.name,
              games: item.games, // 保留所有游戏数据
              displayGames: item.games.slice(0, 12), // 只显示前12个
              id: category ? category.id : null, // 添加分类ID用于More链接
            };
          });
        this.gameData = gameData;

        // 保存到localStorage
        try {
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              data: gameData,
              timestamp: Date.now(),
            }),
          );
        } catch (e) {
          console.error("Failed to save game data to localStorage:", e);
        }

        this.$nextTick(() => {
          handleScroll();
        });
      });
    },
    // 加载热门游戏（带localStorage缓存）
    loadPopularGames() {
      const storageKey = "popularGames_cache";
      const cacheExpiry = 24 * 60 * 60 * 1000; // 24小时过期

      // 检查localStorage中是否有缓存
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        try {
          const cacheData = JSON.parse(cached);
          const now = Date.now();
          // 如果缓存未过期，直接使用
          if (cacheData.timestamp && now - cacheData.timestamp < cacheExpiry) {
            this.popular = cacheData.data || [];
            this.$nextTick(() => {
              handleScroll();
            });
            return;
          }
        } catch (e) {
          console.error("Failed to parse cached popular games:", e);
        }
      }
      axios({
        method: "post",
        url: "https://www.migame.vip/gamefront/gameList/SelectGameByGameType",
        data: {
          gameTypeId: 5, // New类型作为热门游戏
          page: 1,
          limit: 50, // 加载50个热门游戏
        },
      })
        .then((res) => {
          const popularGames = res.data.data || [];
          this.popular = popularGames;
          // 保存到localStorage
          try {
            localStorage.setItem(
              storageKey,
              JSON.stringify({
                data: popularGames,
                timestamp: Date.now(),
              }),
            );
          } catch (e) {
            console.error("Failed to save popular games to localStorage:", e);
          }

          this.$nextTick(() => {
            handleScroll();
          });
        })
        .catch((err) => {
          console.error("Failed to load popular games:", err);
          // 如果API失败，使用静态数据作为后备
          this.popular = popular || [];
        });
    },
    handleToType(category) {
      let typeId = null;
      let typeName = "";
      // 如果category是对象，使用其id和name
      if (typeof category === "object" && category !== null) {
        // 如果对象有id，直接使用
        if (category.id) {
          typeId = category.id;
          typeName = category.name || "";
        } else if (category.name) {
          // 如果对象有name但没有id，从allCategories中查找
          const foundCat = this.allCategories.find(
            (c) => c.name === category.name,
          );
          if (foundCat && foundCat.id) {
            typeId = foundCat.id;
            typeName = foundCat.name;
          }
        }
      } else {
        // 如果是字符串（旧代码兼容）
        const cat = this.allCategories.find(
          (c) => c.name === category || c.id === category,
        );
        if (cat) {
          typeId = cat.id;
          typeName = cat.name;
        }
      }

      // 如果找到了分类ID，生成链接
      if (typeId) {
        return `type.html?type=${typeId}&typeName=${typeName}&gameChannelId=${this.gameChannelId}`;
      }

      console.warn("handleToType: category not found", category);
      return "#";
    },
    handleToDetail(gameId, type) {
      return `detail.html?gameId=${gameId}&gameChannelId=${this.gameChannelId}&type=${type}`;
    },
  },
});
