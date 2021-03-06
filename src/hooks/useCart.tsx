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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data } = await api.get(`stock/${productId}`);
      const stock: Stock = data;
      const productExists = cart.find((product) => product.id === productId);

      if (!productExists && stock.amount > 0) {
        const responseProducts = await api.get<Product>(
          `products/${productId}`
        );

        setCart([...cart, { ...responseProducts.data, amount: 1 }]);

        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify([...cart, { ...responseProducts.data, amount: 1 }])
        );
      } else if (productExists && productExists.amount <= stock.amount) {
        const amount = productExists.amount + 1;
        updateProductAmount({
          productId,
          amount,
        });
      } else {
        toast.error("Quantidade solicitada fora de estoque");
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = async (productId: number) => {
    const productExists = cart.find((product) => product.id === productId);

    if (!productExists) {
      return toast.error("Erro na remoção do produto");
    }

    const updatedCart = cart.filter(product => product.id !== productId)

    setCart(updatedCart);
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productResponse = await api.get<Stock>(`/stock/${productId}`);
      const product = productResponse.data;

      if (amount < 1) {
        return;
      }

      if (amount > product.amount) {
        return toast.error('Quantidade solicitada fora de estoque');
      }

      const updatedCart = cart.map(product => {
        if (product.id === productId) {
          product.amount = amount;
          toast.success('Produto atualizado com sucesso')
          return product;
        }

        return product;
      });

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
