const toThousand = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const path = require("path");
const fs = require("fs");
const db = require("../../database/models");
const Op = db.Sequelize.Op;

const { validationResult } = require('express-validator');

const productsController = {
  main: (req, res) => {
    db.product.findAndCountAll({
      limit: 9,
      offset: req.query.page? req.query.page * 9 : 0
    })
      .then(productsData => {
        let totalPages = Math.ceil(productsData.count / 9)
        let currentPage
        req.query.page? currentPage = parseInt(req.query.page) : currentPage = 0

        //res.send(productsData)
        res.render("./products/products", { productsData: productsData.rows, toThousand, totalPages, currentPage });
      })
      .catch(error => {
        res.send(error)
      })
  },
  search: (req, res) => {
    db.product.findAndCountAll({where :{
      name: {[Op.like]: `%${req.query.search}%`}
    }, limit: 9,
    offset: req.query.page? req.query.page * 9 : 0}
    )
    .then((productsData)=>{
      // res.send(data)
      let totalPages = Math.ceil(productsData.count / 12)
      let currentPage
      req.query.page? currentPage = parseInt(req.query.page) : currentPage = 0
      
      res.render("./products/products", { productsData: productsData.rows, toThousand, totalPages, currentPage });
    });
  },
  details: (req, res) => {
    db.product.findOne({
      where: {id: req.params.id}
    }).then(productData => {
      res.render("./products/productDetail", { productData, toThousand });
    })
    .catch(error => {
      res.send(error)
    })
    
  },
  cart: (req, res) => {
    //Falta ordenar la vista
    db.cart.findAll({
      include: ['product', 'size'],
      where: {'userId': res.locals.user.id }
    })
    .then(productsData => {
      // res.send(productsData)
      res.render(`./products/productCart`, { productsData, toThousand });
    })
    .catch(error => {
      res.send(error)
    })
  },
  addToCart: (req,res)=>{
    let newCartItem = req.body;
    newCartItem.userId = res.locals.user? res.locals.user.id: "anon" ;
    // res.send(newCartItem)
    db.cart.create(newCartItem)
    .then(()=>{
      res.redirect("/products/cart");
    })
    .catch(error => {
      res.send(error)
    })
  },
  removeFromCart: (req,res)=>{
    db.cart.destroy({where: {
      userId: res.locals.user.id,
      productId: req.params.productId,
    }})
    .then(()=>{
      res.redirect("/products/cart")
    })
    .catch(error => {
      res.send(error)
    })
  },
  add: (req, res) => {
    res.render(`./products/productAdd`);
  },
  edit: (req, res) => {
    db.product.findOne(
      {where: {id: req.params.id}}
    )
    .then((product)=>{
      res.render(`./products/productEdit`, { product });
    })
    .catch(error => {
      res.send(error)
    })
  },
  update: (req, res) => {
    let { errors } = validationResult(req)
    // res.send(errors);

    if (errors.length > 1){
      if (req.file) {
        fs.unlinkSync(`${__dirname}/../../public/images/products/imagen - ${path.basename(req.file.originalname)}`)
      }
      res.send(errors); 
    } else if (errors.length == 1 && errors[0].msg != "Debes ingresar una imagen para tu producto"){
      res.send(errors)
      if (req.file) {
        fs.unlinkSync(`${__dirname}/../../public/images/products/imagen - ${path.basename(req.file.originalname)}`)
      }
    } else{
      
      db.product.findOne({
        where: {id: req.params.id}
      })
      .then((foundProduct)=>{
        let updatedProduct = {
          name: req.body.name,
          description: req.body.description,
          categoryId: parseInt(req.body.category),
          price: parseFloat(req.body.price),
          image: null,
          alt: req.body.name  
        }
        if (req.file) {
          if (foundProduct.image) {
            fs.unlinkSync(`${__dirname}/../../public/images/products/${foundProduct.image}`);
          }
          updatedProduct.image = `imagen - ${path.basename(req.file.originalname)}`;
        } else {
          updatedProduct.image = foundProduct.image;
        }
        db.product.update(
          updatedProduct,
          {where: {id: req.params.id}}
        )
        .then(() => {
          db.products_sizes.upsert(
            {productId: req.params.id, sizeId: req.body.size, stock: req.body.stock}, 
            {where: {productId: parseInt(req.params.id), sizeId: parseInt(req.body.size)}}
          )
          .then(() => {
            res.redirect("/products/details/" + req.params.id); 
          })
          .catch(error => {
            res.send(error)
          });
        })
        .catch(error => {
          res.send(error)
        });
      })
      .catch(error => {
        res.send(error)
      });   
    }
  },
  store: (req, res) => {
    
    let { errors } = validationResult(req)

    if (errors.length > 0) {

      res.send(errors)

      // si se sube un archivo y el formulario trae errores, eliminamos el archivo subido
      if (req.file) {
        fs.unlinkSync(`${__dirname}/../../public/images/products/imagen - ${path.basename(req.file.originalname)}`)
      }

      //subida normal de producto
    } else {
      
      let newProduct = {
        name: req.body.name,
        description: req.body.description,
        price: parseFloat(req.body.price),
        image: "imagen - " + path.basename(req.file.originalname),
        alt: req.body.name,
        categoryId: req.body.category
      }
      db.product.create(newProduct)
      .then(product => {
        let newRelation = {
          sizeId: parseInt(req.body.size),
          stock: parseInt(req.body.stock),
          productId: product.id
        }
        db.products_sizes.create(newRelation)
        .then(result => {
          res.redirect("/products/details/" + product.id);  
        })
        .catch(error => {
          res.send(error)
        });
      })
      .catch(error => {
        res.send(error)
      });

    }

    
  },
  delete: (req, res) => {

    db.product.findOne({
      where: {id: req.params.id}
    })
    .then(productToDelete => {
      if (productToDelete.image) {
        fs.unlinkSync(`${__dirname}/../../public/images/products/${productToDelete.image}`);
      }
      db.product.destroy({
        where: {id: req.params.id}
      })
      .then( () => {
        res.redirect("/products");
      })
      .catch(error => {
        res.send(error)
      })
    })
    .catch(error => {
      res.send(error)
    })      

  },
  listAdmin: (req, res) => {
    db.product.findAll({include: ['category','sizes']})
    .then(productsData => {
      res.render(`./products/productListAdmin`, { productsData, toThousand })
    }
    )
  }
};

module.exports = productsController;
