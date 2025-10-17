const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const FDG_API_URL = "https://www.firstdeliverygroup.com/api/v2/create";
const FDG_TOKEN = "d23aa970-7284-4035-a6bf-a29704192bce";

app.post('/shopify-webhook', async (req, res) => {
    try {
        const order = req.body;

        const client = {
            nom: `${order.customer.first_name} ${order.customer.last_name}`,
            gouvernerat: order.shipping_address.province || "",
            ville: order.shipping_address.city,
            adresse: order.shipping_address.address1,
            telephone: order.customer.phone || "",
            telephone2: ""
        };

        const produits = order.line_items.map(item => ({
            article: item.title,
            prix: parseFloat(item.price),
            designation: item.title,
            nombreArticle: item.quantity,
            commentaire: "",
            nombreEchange: 0
        }));

        for (const produit of produits) {
            await axios.post(FDG_API_URL, {
                Client: client,
                Produit: produit
            }, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${FDG_TOKEN}`
                }
            });
        }

        res.status(200).send({ status: 'success', message: 'Orders sent to First Delivery Group' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ status: 'error', message: err.message });
    }
});

app.listen(3000, () => console.log("Middleware server running on port 3000"));
