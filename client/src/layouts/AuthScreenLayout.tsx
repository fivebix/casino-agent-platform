import OdrynLogo from '@/components/common/OdrynLogo';

type Props = {
  children: React.ReactNode;
};

/** Centred card with the odryn lockup (designs 26 / 27) and the "by i-vontx" line under it. */
const AuthScreenLayout = ({ children }: Props) => (
  <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
    <div className="w-full max-w-[440px] rounded-[20px] border border-[#2a2a2e] bg-[#121214]/95 px-8 pb-8 pt-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
      <OdrynLogo />
      <div className="mt-8">{children}</div>
    </div>
    <p className="mt-7 text-[11px] text-faint">odryn agent panel · by i-vontx</p>
  </main>
);

export default AuthScreenLayout;
