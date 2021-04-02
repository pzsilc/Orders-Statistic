$(document).ready(setTimeout(function(){

	//ustawienia
    const TOKEN = "";
    const API = "https://api.baselinker.com/connector.php";



    class App extends Component {
	
		//tu trzymane są wszystkie zamówienia
		state = {
			data: []
		}


		constructor(props){
			super(props);
			let _this = this;
			//pobranie zamówień (100)
			$.ajax({
				url: API,
				method: 'POST',
				data: {
					token: TOKEN,
					method: 'getOrders',
					parameters: '{}'
				},
				success: function(data){
					data = JSON.parse(data);
					if(data.status == 'ERROR') throw new Error("Chwilowo nie można pobrać danych.");

					//data.orders = data.orders.splice(0, 10); //DO USUNUIĘCIA
					
					_this.setState({ data: data.orders.map(sample => {
						return {
							id: sample.order_id,
							baselinkerDate: sample.date_add,
							externalOrderId: sample.external_order_id
						};
					})});

					//akcje pobierające kolejne dane o poszczególnych zamówieniach (każda wykonuje się asynchronicznie)
					setTimeout(async () => {
						await _this.fetchPackages()
						.then(async () => {
							await _this.fetchPackagesHistory()
							.then(async () => {
								await _this.fetchSymfonyData()
								.then(async () => {
									await _this.setState({
										data: _this.state.data
									});
								});
							});
						});
					}, 300);


				},
				error: status => console.error(status)
			})
		}


		//pobiera paczki do zamówień (każde zapytanie to oddzielna akcja). Jeśli zostaną sfetchowane jakieś paczki to pobiera id pierwszej (do statystyki), jeśli nie - pusty string
		fetchPackages(){
			//ta funkcja fetchuje paczki zamówienia o danym id
			const getPackage = id => new Promise(resolve => {
				$.ajax({
					url: API,
					method: 'POST',
					dataType: "json",
					data: {
						token: TOKEN,
						method: 'getOrderPackages',
						parameters: `{ "order_id": ${id} }`
					},
					success: data => resolve(data.packages[0] ? parseInt(data.packages[0].package_id) : ""),
					error: status => console.error(status)
				})
			})

			//iteracja wszystkich zamówień i oczekiwania na "zwrot paczek"
			let _this = this;
			return new Promise(async(resolve) => {
				for(let i = 0; i < _this.state.data.length; i++){
					const sample = _this.state.data[i];
					let packageId = await getPackage(sample.id);
					sample.package = packageId;
				}
				resolve(true);
			});
		}


		//pobieranie historii statusów poszczególnych paczek 
		//na tym etapie 1 zamówienie może mieć przypisaną max 1 paczkę
		//funkcja fetchuje tylko statusy 11 (w drodze) i 1 (utworzono etykietę kurierską)
		fetchPackagesHistory(){
			var arr = this.state.data.filter(i => Number.isInteger(i.package));
			let _this = this;
			return new Promise(resolve => {
				$.ajax({
					url: API,
					method: 'POST',
					dataType: 'json',
					data: {
						token: TOKEN,
						method: 'getCourierPackagesStatusHistory',
						parameters: `{ "package_ids": [${arr.map(i => i.package)}] }`
					},
					success: data => {
						data = data.packages_history;
						for(const sample of _this.state.data){
							if(data[sample.package]){
								//zamówienie z paczką
								data[sample.package].forEach(i => {
									switch(i.tracking_status){
										case '11': { sample.courierDate = parseInt(i.tracking_status_date); }; break;
										case '1': { sample.listDate = parseInt(i.tracking_status_date); }; break;
									}
								})
							} else {
								//zamówienie bez paczki
								sample.courierDate = "";
								sample.listDate = "";
							}
							delete sample.package;
						}
						resolve(true);
					},
					error: status => console.error(status)
				});				
			})
		}


		//pobieranie dat zamówień z Symfonii.
		//wysyłamy tablicę z id poszczeólnych zamówień
		//api wyszukuje je po wzorcach [a {id}] lub [e {id}] i zwraca pasujące zamówienia (a dokładnie ich daty utworzenia)
		fetchSymfonyData(){
			let _this = this;
			let arr = _this.state.data.map(i => i.externalOrderId);
			return new Promise(resolve => {
				$.ajax({
					url: 'server.php',
					method: 'POST',
					data: {
						ids: arr
					},
					success: data => {
						for(let i=0; i<_this.state.data.length; i++){
							let sample = _this.state.data[i];
							sample.symfDate = data[i];
							delete sample.externalOrderId;
						}
						resolve(true);
					},
					error: status => console.log(status)
				})
			})
		}


		//zamienia czas podany w sekundach (time) na ilość dni/godzin/minut (zwraca stringa)
		toDate(time){
			if(!time || !Number.isInteger(time)) return "";
			let dt = new Date(time*1000);
			return (dt.getDate() < 10 ? '0' : '') + dt.getDate() + '.'
					+ (dt.getMonth() < 10 ? '0' : '') + dt.getMonth() + '.' 
					+ dt.getFullYear() + ' ' 
					+ (dt.getHours() < 10 ? '0' : '') + dt.getHours() + ':' 
					+ (dt.getMinutes() < 10 ? '0' : '') + dt.getMinutes() + ':' 
					+ (dt.getSeconds() < 10 ? '0' : '') + dt.getSeconds()
		}


		//renderowanie tabeli
		render(){
			let toDate = this.toDate;
			let res = '';
			this.state.data.forEach(i => {
				res += `
					<tr>
						<td class='order-id'>${i.id}</td>
						<td class='date-0' data-ms=${i.baselinkerDate}>${toDate(i.baselinkerDate)}</td>
						<td class='date-1' data-ms=${i.symfDate}>${toDate(i.symfDate)}</td>
						<td class='date-2' data-ms=${i.listDate}>${toDate(i.listDate)}</td>
						<td class='date-3' data-ms=${i.courierDate}>${toDate(i.courierDate)}</td>
					</tr>
				`;
			});
			return res;
		}

	}

    new App();
}), 1000);

