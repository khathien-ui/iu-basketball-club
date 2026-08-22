export interface GalleryItem {
  src: string;
  caption: string;
  width: number;
  height: number;
}

/** Ảnh gallery — placeholder, thay bằng ảnh thật trong public/images/gallery/ */
export const gallery: GalleryItem[] = [
  { src: "/images/gallery/g1.jpg", caption: "Buổi tuyển quân mùa Thu", width: 800, height: 1000 },
  { src: "/images/gallery/g2.jpg", caption: "Tập luyện tại nhà thi đấu IU", width: 800, height: 600 },
  { src: "/images/gallery/g3.jpg", caption: "Giải đấu 3x3 toàn trường", width: 800, height: 1200 },
  { src: "/images/gallery/g4.jpg", caption: "Đội hình ra sân trận mở màn", width: 800, height: 800 },
  { src: "/images/gallery/g5.jpg", caption: "Khoảnh khắc ăn mừng chiến thắng", width: 800, height: 950 },
  { src: "/images/gallery/g6.jpg", caption: "Hậu trường cùng ban truyền thông", width: 800, height: 650 },
];
