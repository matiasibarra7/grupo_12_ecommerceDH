const express = require("express");
const router = express.Router();
const productsController = require("../controllers/productsController");

router.get("/", productsController.main);
router.get("/details", productsController.details);
router.get("/cart", productsController.cart ); 

module.exports = router;