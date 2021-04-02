$(document).ready(function(){
    
    class ModalForm{
        
        constructor(){
            $('#modal-form').on('submit', e => this.submitHandle(e));
        }

        countDates(fA, tA){
            var res = [];
            let i = 0;
            for(const j of fA){
                let [ x, y ] = [ parseInt(tA[i++]), parseInt(j) ];
                let seconds = x - y;
                if(isNaN(seconds)){ 
                    res.push("");
                } else {
                    let minutes = parseInt(seconds / 60);
                    let hours = parseInt(minutes / 60);
                    let days = parseInt(hours / 24);
                    minutes = minutes % (hours * 60);
                    hours = hours % (days * 24);

                    res.push(`${days} dni, ${hours} godzin, ${minutes} minut`);
                }
            }
            this.display(res);
        }

        submitHandle(e){
            //get data
            e.preventDefault();
            var { from, to } = e.target;
            [ from, to ] = [ from.value, to.value ];
            
            //get columns
            const fromArray = [...document.querySelectorAll(`.date-${from}`)].map(i => i.dataset.ms);
            const toArray = [...document.querySelectorAll(`.date-${to}`)].map(i => i.dataset.ms);
            this.countDates(fromArray, toArray);
        }

        display(res){
            const ids = [...document.querySelectorAll('.order-id')].map(i => i.innerHTML);
            var modalContent = $('#modal-content');
            let html = "<table class='table table'><tr><th class='text-center'>ID</th><th class='text-center'>Międzyczas</th></tr>";
            let i = 0;
            res.forEach(j => {
                html += `<tr>
                    <td class='text-center'>${ids[i++]}</td>
                    <td class='text-center'>${j}</td>
                </tr>`;
            })
            html += "</table>";
            modalContent.html(html);
        }
    }

    new ModalForm();

})