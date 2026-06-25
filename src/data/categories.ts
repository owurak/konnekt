export type CategoryEntry = {
  title: string;
  image: string;
};

export const FEATURED_CATEGORIES: CategoryEntry[] = [
  {
    title: "Beauty & Makeup",
    image: "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
  },
  {
    title: "Groceries & Food",
    image: "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
  },
  {
    title: "Electronics",
    image: "https://images.pexels.com/photos/1841841/pexels-photo-1841841.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
  },
  {
    title: "Shoes & Footwear",
    image: "https://images.pexels.com/photos/19090/pexels-photo.jpg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
  },
];

export const MORE_CATEGORIES: CategoryEntry[] = [
  {
    title: "Printing Services",
    image: "https://images.pexels.com/photos/5691622/pexels-photo-5691622.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
  },
  {
    title: "Fashion & Clothing",
    image: "https://images.pexels.com/photos/1884581/pexels-photo-1884581.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
  },
  {
    title: "Books & Education",
    image: "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
  },
  {
    title: "Phones & Accessories",
    image: "https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
  },
];

export const ALL_CATEGORY_TITLES = [
  ...FEATURED_CATEGORIES.map((c) => c.title),
  ...MORE_CATEGORIES.map((c) => c.title),
];
