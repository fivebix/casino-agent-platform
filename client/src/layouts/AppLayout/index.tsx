import Footer from './Footer';
import NavBar from './NavBar';
import TopBar from './TopBar';

type Props = {
  children: React.ReactNode;
};

/** App shell: top bar, nav row, page content (60px side margins at 1440), footer. */
const AppLayout = ({ children }: Props) => (
  <div className="flex min-h-screen flex-col">
    <div className="overflow-x-auto">
      <div className="min-w-[1180px]">
        <TopBar />
      </div>
    </div>
    <NavBar />
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-[22px] px-4 lg:px-[60px]">
      {children}
    </main>
    <Footer />
  </div>
);

export default AppLayout;
