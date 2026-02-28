import { Loader as Spinner } from 'lucide-react';

const Loader = () => (
  <div className="flex items-center justify-center py-4">
    <Spinner className="w-8 h-8 text-red-500 animate-spin" />
  </div>
);

export default Loader;
