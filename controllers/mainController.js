const productsData = require("../JSON/productsObject");

const mainController = {
    main: (req, res) => {
        res.render('./index/index', { productsData });
      },
    us: (req, res) => {
        res.render('./index/about-us');
      }
}

module.exports = mainController;