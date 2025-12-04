// import express from "express"
// import { Cloudinary } from "@cloudinary/url-gen"
// import { createClient } from "@supabase/supabase-js"
// import dotenv from "dotenv"

// dotenv.config()
// const app = express()

// const supabaseUrl = process.env.SUPABASE_URL
// const supabaseKey = process.env.SUPABASE_KEY
// const supabase = createClient(supabaseUrl, supabaseKey)


// async function getPublicIdFromDb(productId, skuCode, imageNo) {
// 	try {
// 		const { data, error } = await supabase
// 			.from("product")
// 			.select("public_id")
// 			.eq("product_id", productId)
// 			.eq("sku_code", skuCode)
// 			.eq("image_no", parseInt(imageNo, 10))
// 			.single()

// 		if (error) {
// 			console.error("Error fetching public-id:", error.message)
// 			return null
// 		}

// 		return data ? data?.public_id : null
// 	} catch (err) {
// 		console.error("An unexpected error occurred", err)
// 		return null
// 	}
// }

// const cld = new Cloudinary({
// 	cloud: {
// 		cloudName: process.env.CLOUDNAME,
// 	},
// })

// // Define the route to handle the image requests with optiona transformations
// app.get("/images/:productId/:skuCode/:imageNo", async (req, res) => {
	
// 	let { productId, skuCode, imageNo } = req.params
// 	const { w, h, c, q, watermark } = req.query // Destructure query params (w: width, h: height, c: crop, q: quality, watermark: true/false)


// 	try {
// 		let publicId = await getPublicIdFromDb(productId, skuCode, imageNo)

// 		if (!publicId) {
// 				productId = "7164522233995"
// 				skuCode = "bison-black"
// 				publicId = await getPublicIdFromDb(productId, skuCode, imageNo)

// 				if (!publicId) {
// 					return res.status(404).send("Image not found")
// 				}
// 		}

// 		// Start building the Cloudinary image object
// 		let image = cld.image(publicId)

// 		// Conditionally apply transformations based on query parameters
// 		const transformations = []
// 		if (w) transformations.push(`w_${w}`)
// 		if (h) transformations.push(`h_${h}`)
// 		if (c) transformations.push(`c_${c}`)

// 		if (transformations.length > 0) {
// 			image = image.resize(transformations.join(","))
// 		}

// 		if (q) {
// 			image = image.quality(q)
// 		}

// 		// Always apply smart format and quality settings for optimization
// 		image = image.format("auto").quality("auto")

// 		// Generate the URL and conditionally add watermark
// 		let imageUrl = image.toURL()
		
// 		// Only add watermark if watermark parameter is 'true'
// 		if (watermark === 'true') {
// 			// Add watermark parameters to the URL (insert before the image public_id)
// 			// Format: /l_watermark_public_id,g_south_east,x_10,y_10,w_100/
// 			const watermarkParams = "l_tendrilsio_logo_qnpef1,g_south_east,x_10,y_10,w_100"
// 			const urlParts = imageUrl.split('/upload/')
// 			if (urlParts.length === 2) {
// 				imageUrl = `${urlParts[0]}/upload/${watermarkParams}/${urlParts[1]}`
// 			}
// 		}

// 		res.redirect(302, imageUrl)
// 	} catch (error) {
// 		console.error("Error redirecting to image:", error)
// 		res.status(500).send("Internal Server Error")
// 	}
// })

// app.get("/health", (req, res) => {
// 	res.send("api server is good health");
// })

// app.get("/",(req, res) => {
// 	res.send("Home route of this api");
// })

// const PORT = process.env.PORT || 3000
// app.listen(PORT, () => {
// 	console.log(`Image server running on Port:${PORT}`)
// })

import express from "express"
import { Cloudinary } from "@cloudinary/url-gen"
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import fetch from "node-fetch";

dotenv.config()
const app = express()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Existing function used for both images + GLB
async function getPublicIdFromDb(productId, skuCode, imageNo) {
	try {
		const { data, error } = await supabase
			.from("product")
			.select("public_id")
			.eq("product_id", productId)
			.eq("sku_code", skuCode)
			.eq("image_no", parseInt(imageNo, 10))
			.single()

		if (error) {
			console.error("Error fetching public-id:", error.message)
			return null
		}

		return data ? data.public_id : null
	} catch (err) {
		console.error("Unexpected DB error:", err)
		return null
	}
}

const cld = new Cloudinary({
	cloud: { cloudName: process.env.CLOUDNAME }
})

/* ===============================
   IMAGE ROUTE (existing, unchanged)
   =============================== */
app.get("/images/:productId/:skuCode/:imageNo", async (req, res) => {
	let { productId, skuCode, imageNo } = req.params
	const { w, h, c, q, watermark } = req.query

	try {
		let publicId = await getPublicIdFromDb(productId, skuCode, imageNo)

		// fallback product logic (your original code)
		if (!publicId) {
			productId = "7164522233995"
			skuCode = "bison-black"
			publicId = await getPublicIdFromDb(productId, skuCode, imageNo)
			if (!publicId) return res.status(404).send("Image not found")
		}

		let image = cld.image(publicId)

		const transformations = []
		if (w) transformations.push(`w_${w}`)
		if (h) transformations.push(`h_${h}`)
		if (c) transformations.push(`c_${c}`)
		if (transformations.length > 0) image = image.resize(transformations.join(","))
		if (q) image = image.quality(q)

		// Auto format and quality
		image = image.format("auto").quality("auto")
		let imageUrl = image.toURL()

		// watermark if needed
		if (watermark === "true") {
			const watermarkParams = "l_tendrilsio_logo_qnpef1,g_south_east,x_10,y_10,w_100"
			const urlParts = imageUrl.split("/upload/")
			if (urlParts.length === 2) {
				imageUrl = `${urlParts[0]}/upload/${watermarkParams}/${urlParts[1]}`
			}
		}

		res.redirect(302, imageUrl)
	} catch (err) {
		console.error("Error redirecting to image:", err)
		res.status(500).send("Internal Server Error")
	}
})

/* =====================================
   NEW: 3D MODEL ROUTE (GLB delivery)
   ONE GLB PER PRODUCT + SKU
   image_no = 9999 slot
   ===================================== */
app.get("/models/:productId/:skuCode", async (req, res) => {
  const { productId, skuCode } = req.params;

  try {
    const publicId = await getPublicIdFromDb(productId, skuCode, 9999);

    if (!publicId) {
      return res.status(404).json({ error: "3D Model not found" });
    }

    const glbUrl = `https://res.cloudinary.com/${process.env.CLOUDNAME}/raw/upload/${publicId}.glb`;

    // Fetch GLB as buffer (works on Vercel)
    const cloudRes = await fetch(glbUrl);

    if (!cloudRes.ok) {
      return res.status(500).send("Failed to fetch GLB");
    }

    const arrayBuffer = await cloudRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // CORS fix + correct headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "model/gltf-binary");
    res.setHeader("Content-Length", buffer.length);

    return res.send(buffer);

  } catch (err) {
    console.error("MODEL ROUTE ERROR:", err);
    return res.status(500).send("Internal server error");
  }
});


/* =========== Health / Home =========== */

app.get("/health", (req, res) => {
	res.send("api server is good health")
})

app.get("/", (req, res) => {
	res.send("Home route of this api")
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Image server running on Port:${PORT}`))
