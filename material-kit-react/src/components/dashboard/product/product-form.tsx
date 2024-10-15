"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { ReactSortable } from "react-sortablejs";
import { CameraPlus as CameraPlusIcon } from "@phosphor-icons/react";
import { Trash as Delete } from "@phosphor-icons/react";
import {
  TextField,
  Select,
  MenuItem,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Box,
  IconButton,
  CircularProgress,
  Paper,
} from "@mui/material";


interface ProductFormProps {
  _id?: string;
  title?: string;
  category?: string;
  description?: string;
  price?: string;
  images?: string[];
  properties?: Record<string, string>;
}

interface Category {
  _id: string;
  name: string;
  properties: { name: string; values: string[] }[];
  parent?: Category;
}

export default function ProductForm({
  _id,
  title: existingTitle = "",
  category: existingCategory = "",
  description: existingDescription = "",
  price: existingPrice = "",
  images: existingImages = [],
  properties: assignedProperties = {},
}: ProductFormProps) {
  const [title, setTitle] = useState(existingTitle || "");
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState(existingCategory || "");
  const [description, setDescription] = useState(existingDescription || "");
  const [productProperties, setProductProperties] = useState<Record<string, string>>(assignedProperties || {});
  const [price, setPrice] = useState(existingPrice || "");
  const [images, setImages] = useState<string[]>(existingImages || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();


  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const result = await axios.get("/api/categories");
      setCategories(result.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }

  // SAVE PRODUCT TO DATABASE
  async function saveProduct(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setIsSaving(true);

    if (!title || !category || !price || !images.length) {
      Swal.fire({
        title: "Validation Error",
        text: "Please fill in all required fields: Product name, category, price, and at least one image.",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    const data = {
      title,
      description,
      price,
      images,
      category,
      properties: productProperties,
    };

    try {
      await axios.post("/api/products", data);
      Swal.fire({
        title: "Success",
        text: "Product created successfully!",
        icon: "success",
        confirmButtonText: "OK",
      });
      router.push("/dashboard/products");
    } catch (error) {
      setIsSaving(false);
      const errorMessage = (error as any).response?.status === 500
        ? "Server error: Unable to save product."
        : (error as any).message === "Network Error"
          ? "Network error: Please check your internet connection."
          : "Something went wrong. Please try again.";

      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setIsSaving(false);
    }
  }


  // UPLOAD IMAGES TO IMAGEKIT AND GET URLS
  async function uploadImages(ev: React.ChangeEvent<HTMLInputElement>) {
    const files = ev.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    const data = new FormData();
    Array.from(files).forEach((file) => data.append("file", file));

    try {
      const res = await axios.post("/api/productUpload", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setImages((prev) => [...prev, ...res.data.urls]);
    } catch (error) {
      setIsUploading(false);
      console.error("Upload Error:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to upload images. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setIsUploading(false);
    }
  }


  // UPDATE IMAGES ORDER
  function updateImagesOrder(newImages: string[] | any) {
    setImages(newImages);
  }

  // REMOVE IMAGE
  function removeImage(link: string) {
    setImages(images.filter((img) => img !== link));
  }

  // SET PRODUCT PROPERTY
  function setProductProp(propName: string, value: string) {
    setProductProperties((prev) => ({
      ...prev,
      [propName]: value,
    }));
  }

  // GET PROPERTIES TO FILL BASED ON SELECTED CATEGORY
  const propertiesToFill: { name: string; values: string[] }[] = [];
  if (categories.length && category) {
    let currentCategory = categories.find((cat) => cat._id === category);
    while (currentCategory) {
      propertiesToFill.push(...currentCategory.properties);
      currentCategory = currentCategory.parent;
    }
  }

  return (
    <form onSubmit={saveProduct}>
      <Typography variant="h4" mb="1rem">Product Form</Typography>

      {/* PRODUCT NAME */}
      <TextField
        label="Product Name"
        variant="outlined"
        fullWidth
        margin="normal"
        value={title}
        onChange={(ev) => setTitle(ev.target.value)}
        required
      />

      {/* CATEGORY */}
      <FormControl fullWidth margin="normal">
        <InputLabel>Category</InputLabel>
        <Select
          value={category}
          onChange={(ev) => setCategory(ev.target.value)}
          label="Category"
          required
        >
          <MenuItem value="">Uncategorized</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category._id} value={category._id}>
              {category.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* PRODUCT PROPERTIES */}
      {propertiesToFill.length > 0 &&
        propertiesToFill.map((prop) => (
          <FormControl fullWidth margin="normal" key={prop.name}>
            <InputLabel>{prop.name.charAt(0).toUpperCase() + prop.name.slice(1)}</InputLabel>
            <Select
              value={productProperties[prop.name] || ""}
              onChange={(ev) => setProductProp(prop.name, ev.target.value)}
              label={prop.name.charAt(0).toUpperCase() + prop.name.slice(1)}
            >
              {prop.values.map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ))
      }


      {/* PRODUCT PHOTO */}
      <Typography sx={{ m: '15px 0 5px 0', color: '#666' }}>Photos</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          <ReactSortable
            list={images.map((img) => ({ id: img, img }))}
            setList={(newState) => updateImagesOrder(newState.map((item) => item.img))}
            style={{ display: "flex", flexWrap: "wrap", gap: 1 }}
          >
            {images.map((link) => (
              <Box key={link} sx={{ position: "relative", width: 96, height: 96, mr: "10px" }}>
                <Paper
                  sx={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    padding: 1,
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: 1,
                    backgroundColor: "white",
                  }}
                >
                  <img
                    src={link}
                    alt="Product Image"
                    style={{ width: "100%", height: "100%", borderRadius: 2 }}
                  />
                  <IconButton
                    onClick={() => removeImage(link)}
                    sx={{
                      position: "absolute",
                      top: 1,
                      right: 1,
                      color: "white",
                      backgroundColor: "red",
                      opacity: 0.8,
                      padding: ".2rem",
                      "&:hover": { opacity: 1, color: "crimson" },
                    }}
                  >
                    <Delete size={16} />
                  </IconButton>
                </Paper>
              </Box>
            ))}
          </ReactSortable>
        </Box>


        {isUploading && (
          <Box
            sx={{
              height: 96,
              width: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CircularProgress />
          </Box>

        )}

        <label>
          <Button
            variant="outlined"
            component="label"
            sx={{ width: 96, height: 96, display: "flex", justifyContent: "center", alignItems: "center" }}
          >
            <CameraPlusIcon size={32} />
            <input type="file" multiple hidden onChange={uploadImages} />
          </Button>
        </label>
      </Box>


      {/* PRODUCT DESCRIPTION */}
      <TextField
        label="Description"
        variant="outlined"
        fullWidth
        multiline
        rows={4}
        margin="normal"
        value={description}
        onChange={(ev) => setDescription(ev.target.value)}
      />

      {/* PRODUCT PRICE */}
      <TextField
        label="Price (USD)"
        variant="outlined"
        fullWidth
        margin="normal"
        value={price}
        onChange={(ev) => setPrice(ev.target.value)}
        required
      />

      <Button variant="contained" color="primary" type="submit" sx={{ mt: 3 }} disabled={isUploading || isSaving}>
        {isSaving ? <CircularProgress size={18} /> : "Save"}
      </Button>
    </form>
  );
}
