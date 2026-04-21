import React, { createContext, useContext } from 'react'
import { useProducts } from '../hooks/useProducts'

const ProductsContext = createContext(null)

export function ProductsProvider({ children }) {
  const products = useProducts()
  return (
    <ProductsContext.Provider value={products}>
      {children}
    </ProductsContext.Provider>
  )
}

export function useProductsContext() {
  return useContext(ProductsContext)
}
