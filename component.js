class Component{

    constructor(props){
        this.state = {};
        this.componentDidMount(this.state, props);
        this.componentDidUpdate(this.state, props);
    }

    setState(data = {}){
        const _this = this;
        return new Promise(resolve => {
            for(const [key, value] of Object.entries(data)){
                _this.state[key] = value;
            }
            _this.update();
            resolve(true);
        });
    }

    update(){
        const str = this.render();
        const root = document.getElementById('root');
        if(root){
            root.innerHTML = str;
        }
    }

    componentDidUpdate(state, props){}

    componentDidMount(state, props){}

    render(){
        return "";
    }
}