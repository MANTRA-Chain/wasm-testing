type Props = {
  icon: React.ReactNode;
  title: React.ReactNode;
};

export const DialogIconHeader: React.FC<Props> = ({ icon, title }) => {
  return (
    <div className="flex flex-col items-center gap-6 self-center">
      <div>{icon}</div>
      <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
    </div>
  );
};
