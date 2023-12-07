import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";

interface CustomArrowProps {
  onClick?: () => void;
  currentSlide?: number;
  slideCount?: number;
  skip?: number;
}

export const CustomLeftArrow: React.FC<CustomArrowProps> = ({
  onClick,
  currentSlide,
}) => (
  <button
    onClick={onClick}
    className={`absolute left-0 top-1/2 z-10 bg-accent p-3 rounded-full text-white hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent-dark transform -translate-y-1/2 ${
      currentSlide === 0 ? "bg-gray-500 cursor-not-allowed" : ""
    }`}
    style={{ boxShadow: "0 4px 6px rgba(30, 58, 138, 0.3)" }}
    disabled={currentSlide === 0}
  >
    <AiOutlineLeft />
  </button>
);

export const CustomRightArrow: React.FC<CustomArrowProps> = ({
  onClick,
  currentSlide,
  slideCount,
  skip = 1,
}) => (
  <button
    onClick={onClick}
    className={`absolute right-0 top-1/2 z-10 bg-accent p-3 rounded-full text-white hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent-dark transform -translate-y-1/2 ${
      currentSlide !== undefined &&
      slideCount !== undefined &&
      currentSlide + skip === slideCount
        ? "bg-gray-500 cursor-not-allowed"
        : ""
    }`}
    style={{ boxShadow: "0 4px 6px rgba(30, 58, 138, 0.3)" }}
    disabled={
      currentSlide !== undefined &&
      slideCount !== undefined &&
      currentSlide + 1 === slideCount
    }
  >
    <AiOutlineRight />
  </button>
);
