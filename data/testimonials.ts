export interface Testimonial {
  quote: string;
  author: string;
  note: string;
}

/** Cảm nhận thành viên — section What members say */
export const testimonials: Testimonial[] = [
  {
    quote:
      '"Tham gia CLB là quyết định đúng đắn nhất năm nhất của mình. Đến vì bóng rổ, ở lại vì một gia đình."',
    author: "Thành viên CLB",
    note: "Placeholder — thay bằng cảm nhận thật",
  },
  {
    quote:
      '"Buổi tuyển quân rất thân thiện kể cả với người mới. Các anh chị coach quan tâm nỗ lực trước, kỹ năng sau."',
    author: "Tân binh",
    note: "Placeholder — thay bằng cảm nhận thật",
  },
  {
    quote:
      '"Cùng ban điều hành tổ chức giải 3x3 dạy mình nhiều điều hơn bất kỳ lớp học nào."',
    author: "Thành viên ban điều hành",
    note: "Placeholder — thay bằng cảm nhận thật",
  },
];
