const express = require("express");
const router = express.Router();
const productsController = require("../controllers/productsController");
const path = require("path");
const adminRoute = require("../middlewares/adminRoute");
const userRoute = require("../middlewares/userRoute");

const validate = require('../validators/product')


const multer = require("multer");
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `${__dirname}/../../public/images/products`);
  },
  filename: function (req, file, cb) {
    cb(null, "imagen - " + path.basename(file.originalname));
  },
});

upload = multer({ storage });

router.get("/", productsController.main); //1 -- Listado de productos

router.get("/search", productsController.search) // -- Buscador de productos

router.get("/add", userRoute, adminRoute, productsController.add); //2 -- Formulario de creación de productos

router.get("/details/:id", productsController.details); //3 -- Detalle de un producto particular

router.post("/add", upload.single("image"), validate.validateProduct, productsController.store); //4 -- Acción de creación (a donde se envía el formulario)

router.get("/edit/:id", userRoute, adminRoute, productsController.edit); // 5 -- Formulario de edición de productos

router.put("/edit/:id", upload.single("image"), validate.validateProduct, productsController.update); // 6 -- Acción de edición (a donde se envía el formulario):

router.delete("/edit/:id", userRoute, adminRoute, productsController.delete); // 7 -- Acción de borrado

router.get("/cart", userRoute , productsController.cart); 

router.get("/productListAdmin", userRoute, adminRoute, productsController.listAdmin); 

router.post("/addToCart", userRoute, productsController.addToCart);

router.delete("/removeFromCart/:productId", productsController.removeFromCart)

module.exports = router;
