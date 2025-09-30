import { Button, Toast } from "@douyinfe/semi-ui";


const App = () => {
  return (
    <Button onClick={() => Toast.warning({ content: "welcome" })}>
      Hello Semi
    </Button>
  );
};

export default App;
