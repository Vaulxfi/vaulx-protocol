import { PhoneBezel, PhoneFullBleed } from "@/app/demo/_components/phone-bezel";

export default function DevBezel() {
  return (
    <>
      <PhoneBezel><div className="p-6">Hello bezel</div></PhoneBezel>
      <PhoneFullBleed><div className="p-6">Hello full-bleed</div></PhoneFullBleed>
    </>
  );
}
