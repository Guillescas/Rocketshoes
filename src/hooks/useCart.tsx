import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@Rocketshoes.cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });
  
  const addProduct = async (productId: number) => {
    try {
      const productAmountResponse = await api.get<UpdateProductAmount>(`/stock/${productId}`);
      const productAmount = productAmountResponse.data.amount;

      if (productAmount === 0) {
        toast.error('Quantidade solicitada fora de estoque')
      } else {
        await api.put(`/stock/${productId}`, {
          amount: productAmount - 1,
        });

        const productResponse = await api.get(`/products/${productId}`);
        const product = productResponse.data;

        const productIndex = cart.findIndex(product => product.id === productId);

        if (productIndex < 0) {
          product.amount = 1;

          setCart([...cart, product]);
          localStorage.setItem('@Rocketshoes.cart', JSON.stringify([...cart, product]));
        } else {
          const updatedCart = cart.map(product => {
            if (product.id === productId) {
              product.amount ? (product.amount = product.amount + 1) : product.amount = 1;
              toast.success('Produto adicionado')  
              return product;
            }

            else return product;
          })
          setCart(updatedCart);
          localStorage.setItem('@Rocketshoes.cart', JSON.stringify(updatedCart));
        }
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };  

  const removeProduct = async (productId: number) => {
    try {
      await api.put(`/stock/${productId}`, );
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

    } catch {
      toast.error('Não conseguimos analisar o estoque :(');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
