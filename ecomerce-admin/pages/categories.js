import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';


export default function Categories() {
  const [name, setName] = useState();
  const [parentCategory, setParentCategory] = useState();
  const [categories, setCategories] = useState([]);
  const [editedCategory, setEditedCategory] = useState();

  useEffect(() => {
    fetchCategories();
  }, [])
  function fetchCategories() {
    axios.get('/api/categories').then(result => {
      setCategories(result.data);
    });
  }


  async function saveCategory(ev) {
    ev.preventDefault();
    const data = { name, parentCategory }

    if (editedCategory) {
      data._id = editedCategory._id;
      console.log(data._id)
      await axios.put('/api/categories', data)
      setEditedCategory(null)
    } else {
      await axios.post('/api/categories', data)
    }
    setName('')
    fetchCategories()
  }

  // EDIT
  function editCategory(category) {
    setEditedCategory(category);
    setName(category.name);
    setParentCategory(category?.parent?._id)
  }

  // DELETE
  function handleDelete(category) {
    Swal.fire({
      title: 'Are you sure?',
      text: `You want to delete ${category.name}!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire(
          'Deleted!',
          `Your ${category.name} category has been deleted.`,
          'success'
        );
        const { _id } = category
        await axios.delete('/api/categories?_id=' + _id);
        fetchCategories();
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire(
          'Cancelled',
          `Your ${category.name} category is safe.`,
          'error'
        );
      }
    });
  }

  return (
    <Layout>
      <h1>Categories</h1>
      <label className='text-lg'>{
        name
          ? `Edit category ${name}`
          : 'New category name'}
      </label>
      <form onSubmit={saveCategory} className="flex gap-1 mt-1">
        <input
          type="text"
          className="mb-0"
          placeholder={'Category name'}
          onChange={ev => setName(ev.target.value)}
          value={name}
        />

        <select
          onChange={ev => setParentCategory(ev.target.value)}
          value={parentCategory}
          className='mb-0'
        >
          <option value=""> No parent category</option>
          {categories.length > 0 && categories.map(category => (
            <option key={category._id} value={category._id}>{category.name}</option>
          ))}
        </select>

        <button type="submit" className="btn-primary py-1">Save</button>
      </form>
      <table className="basic mt-4">
        <thead>
          <tr>
            <td>Category name</td>
            <td>Parent category</td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          {categories.length > 0 && categories.map(category => (
            <tr key={category._id}>
              <td>{category.name}</td>
              <td>{category?.parent?.name}</td>
              <td>
                <button
                  onClick={() => editCategory(category)}
                  className="btn-default mr-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  className="btn-red">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}
