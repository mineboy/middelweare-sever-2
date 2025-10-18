// inside your server.js (replace the old handler)
app.post("/shopify/order-created", async (req, res) => {
  try {
    const order = req.body || {};

    // extract shipping address safely
    const ship = order.shipping_address || {};
    const lineItems = Array.isArray(order.line_items) ? order.line_items : [];

    // Build client object as FDG expects
    const client = {
      nom: `${(ship.first_name || "").trim()} ${(ship.last_name || "").trim()}`.trim() || (order.customer?.first_name ? `${order.customer.first_name} ${order.customer.last_name || ""}`.trim() : "Client inconnu"),
      gouvernerat: ship.province || ship.province_code || "", // province from Shopify
      ville: ship.city || "",
      adresse: `${ship.address1 || ""}${ship.address2 ? " / " + ship.address2 : ""}`,
      telephone: ship.phone || order.phone || (order.customer?.phone || ""),
      telephone2: "" // optional second phone
    };

    // Build produit object using the first line item as a default.
    // If you want to send multiple products adapt this to map all lineItems.
    const firstItem = lineItems[0] || {};
    const produit = {
      article: firstItem.sku || firstItem.title || "article",
      prix: Number(firstItem.price || firstItem.final_price || order.total_price || 0),
      designation: firstItem.title || "produit",
      nombreArticle: Number(firstItem.quantity || 1),
      commentaire: (order.note || ""),
      nombreEchange: 0
    };

    // Full payload matching FDG example
    const payload = {
      Client: client,
      Produit: produit,
      // optional extra fields FDG might accept — keep empty or add if needed
      // Remarque: if FDG expects other top-level keys (e.g. "mode", "service"), add them here
    };

    // Send to FDG
    const fdgResponse = await axios.post(
      `${process.env.FDG_API_URL || "https://www.firstdeliverygroup.com/api/v2"}/create`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": process.env.FDG_TOKEN || "d23aa970-7284-4035-a6bf-a29704192bce"
          // If they expect "Bearer <token>" use ``Authorization: `Bearer ${process.env.FDG_TOKEN}```
        },
        timeout: 15000
      }
    );

    console.log("FDG response:", fdgResponse.data);
    return res.status(200).json({ success: true, fdgResponse: fdgResponse.data });
  } catch (err) {
    console.error("Error sending to FDG:", err.response?.data || err.message || err);
    return res.status(500).json({
      success: false,
      message: "Failed to send order to FDG",
      error: err.response?.data || err.message
    });
  }
});
