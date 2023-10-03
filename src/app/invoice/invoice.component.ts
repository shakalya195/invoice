import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import {getCurrencySymbol}from '@angular/common';

@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.scss']
})
export class InvoiceComponent implements OnInit {

  @ViewChild('printmedia', { static: false }) printmedia!: ElementRef;
  hide=false;
  bgColor:string="#fff0f0";
  accentColor:string="#90317c";
  taxColor:string="#888888"

  Object=Object;
  currencyCode='USD';
  maxDate=new Date();
  invoiceData:any={
    bgColor:"#fff0f0",
    accentColor:"#90317c",
    taxes:[
      {type:"flat",description:"GST",value:12},
      {type:"percentage",description:"SGST",value:6},
      {type:"percentage",description:"CGST",value:6},
    ],
    columns:{
      items:'Items',
      description:'Description',
      quantity:'Quanity',
      units:'Unit',
      price:'Price',
      amount:'Amount',
    },
    visibleColumns:{
      items:true,
      description:true,
      quantity:true,
      units:true,
      price:true,
      amount:true,
    }
  };
  invoiceSetting:any={};
  columns:any={};
  items:any[]=[];

  allSites:any[]=[];
  filteredSites:any[]=[];
  selectedSite:any;
  searchSite:string='';

  allCustomers:any[]=[];
  filteredCustomers:any[]=[];
  selectedCustomer:any;
  searchCustomer:string='';

  addOnBlur = true;
  removable =true;
  emails: any[] = [];
  newEmail:any;

  subTotal=0;
  taxes:any[]=[];
  totalTax:number=0;
  subTotalAfterTax:number= 0;

  displayTaxes:any={};

  discounts:any[]=[];
  totalDiscount:number=0;
  subTotalAfterDiscount:number=0;

  filteredProducts:any=[];
  allTaxes=[];filteredTaxes:any=[];
  newTax:any;

  meta:string='invoice';
  available:boolean=false;
  invoiceNumberError:string='';
  productSubscription$$:Subscription | undefined;
  previewMode=false;
  index=-1;
  url='/assets/FEDEX.png';
  
  infos=[
    {name:'Invoice Number', value:'#242423'},
    {name:'Invoice Date', value:'23 dec 2012'},
    {name:'Order Number', value:'512'},
  ];

  spaces:any[]=[];
  window=window;

  constructor(
    private toastr:ToastrService,
  ) { }

  ngOnInit(): void {

    if(localStorage.getItem('invoice')){
      this.invoiceData = JSON.parse(localStorage.getItem('invoice'));
      this.invoiceData.bgColor ? this.bgColor = this.invoiceData.bgColor:'';
      this.invoiceData.accentColor ? this.accentColor = this.invoiceData.accentColor:'';
      this.invoiceData.taxColor ? this.taxColor = this.invoiceData.taxColor:'';
    }
    this.getAllTaxes();
    // for(let i=0; i <30; i++){
    //   this.addNewItem(i);
    // }
  }

  getCurrencySymbol(){
    return getCurrencySymbol(this.currencyCode,"narrow");
  }

  changePreviewMode(){
    if(this.previewMode){
      this.preview();
    }else{
      this.previewClear();
    }
  }
  preview(){
    this.previewMode = true;
    Array.from(document.getElementsByClassName('noPrint') as HTMLCollectionOf<HTMLElement>).forEach(el=>{
      el.classList.add('active');
    });
  }
  previewClear(){
    this.previewMode = false;
    Array.from(document.getElementsByClassName('noPrint') as HTMLCollectionOf<HTMLElement>).forEach(el=>{
      el.classList.remove('active');
    });
  }

  onfileChange(event){
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
          this.url = e.target.result;
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  exportPDF(){
    this.preview();

    setTimeout(()=>{
      this.makePDF1();
      // this.makePDF2();
    },1000);

  }
  makePDF1(){
     html2canvas(this.printmedia.nativeElement,{
        allowTaint: true,
        useCORS: true
      }).then(canvas=>{
        // document.getElementById('can').append(canvas);
        // console.log('canvas',canvas.width, canvas.height);
        var w = canvas.width;
        var h = w*1.25;
        // alert(`${canvas.width}  ${canvas.height} ${w} ${h}`);
        const imgData = canvas.toDataURL('image/jpeg');
        // console.log('imgData',imgData);
        // document.getElementsByClassName('cccc')[0].append(canvas);
        document.getElementById('can').append(canvas);
        // const pdf = new jsPDF({
        //   orientation:'portrait'
        // });
        // const imageProps = pdf.getImageProperties(imgData)
        // const pdfw = pdf.internal.pageSize.getWidth()
        // const pdfh = (imageProps.height * pdfw) / imageProps.width;
        // console.log('WIDTH====>',pdfw,'HEIGHT===>',pdfh);
        // pdf.addImage(imgData, 'PNG', 0, 0, pdfw, pdfh)
        // pdf.save("invoice-"+Date.now()+".pdf");
        // this.previewClear();
        const pdf = new jsPDF({
          orientation:'portrait'
        });
        for (var i = 0; i <= this.printmedia.nativeElement.clientHeight/1200; i++) {
          let onePageCanvas = document.createElement("canvas");
          onePageCanvas.setAttribute('width', `${w}`);
          onePageCanvas.setAttribute('height', `${h}`);

          var ctx = onePageCanvas.getContext('2d');
          ctx.fillStyle = this.bgColor;
          ctx.fillRect(0,0,5000,10000);

          var ctx = onePageCanvas.getContext('2d');
          ctx.drawImage(canvas,0,h*i,w,h,0,0,w,h);
          // document.getElementById('can').append(onePageCanvas);
          
          const imgData = onePageCanvas.toDataURL('image/jpeg');
          const imageProps = pdf.getImageProperties(imgData)
          const pdfw = pdf.internal.pageSize.getWidth()
          const pdfh = (imageProps.height * pdfw) / imageProps.width;
          // console.log('WIDTH====>',pdfw,'HEIGHT===>',pdfh);


          let bg = document.createElement("canvas");
          bg.setAttribute('width', `${w}`);
          bg.setAttribute('height', `${h}`);
          var ctx = bg.getContext('2d');
          ctx.fillStyle = this.bgColor;
          ctx.fillRect(0,0,5000,10000);
          const bgData = bg.toDataURL('image/jpeg');
          // document.getElementById('can').append(bg);
          if (i > 0) {
            pdf.addPage([210, 262]); //8.5" x 11" in pts (in*72)
          }
          // //! now we declare that we're working on that page
          pdf.setPage(i+1);
          pdf.addImage(bgData, 'JPEG', 0, 0, 5000, 10000);
          if(i==0){
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfw, pdfh);
          }else{
            pdf.addImage(imgData, 'JPEG', 0, 20, pdfw, pdfh);
          }
          
        }
        pdf.save("invoice-"+Date.now()+".pdf");
      });
  }

  makePDF2() {

    var quotes = this.printmedia.nativeElement;
    html2canvas(quotes).then((canvas) => {
         //! MAKE YOUR PDF
         
         var pdf = new jsPDF('p', 'pt', 'letter');
 
         for (var i = 0; i <= quotes.clientHeight/1100; i++) {
             //! This is all just html2canvas stuff
             var srcImg  = canvas;
             var sX      = 0;
             var sY      = 1100*i; // start 980 pixels down for every new page
             var sWidth  = 900;
             var sHeight = 1100;
             var dX      = 0;
             var dY      = 0;
             var dWidth  = 900;
             var dHeight = 1100;
 
             let onePageCanvas = document.createElement("canvas");
             onePageCanvas.setAttribute('width', '900');
             onePageCanvas.setAttribute('height', '1200');
             var ctx = onePageCanvas.getContext('2d');
             // details on this usage of this function: 
             // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Using_images#Slicing
             ctx.drawImage(srcImg,sX,sY,sWidth,sHeight,dX,dY,dWidth,dHeight);
          
             document.getElementById('can').append(onePageCanvas);
             // document.body.appendChild(canvas);
             var canvasDataURL = onePageCanvas.toDataURL("image/png", 1.0);
 
             var width         = onePageCanvas.width;
             var height        = onePageCanvas.clientHeight;
 
             //! If we're on anything other than the first page,
             // add another page
             if (i > 0) {
                 pdf.addPage([612, 791]); //8.5" x 11" in pts (in*72)
             }
             //! now we declare that we're working on that page
             pdf.setPage(i+1);
             //! now we add content to that page!
             if(i == 0){
              pdf.addImage(canvasDataURL, 'PNG', 0, 0,pdf.internal.pageSize.getWidth(), (height*.62));
             }else{
              pdf.addImage(canvasDataURL, 'PNG', 0, 20,pdf.internal.pageSize.getWidth(), (height*.62));
             }
             
 
         }
         //! after the for loop is finished running, we save the pdf.
         pdf.save("invoice-"+Date.now()+".pdf");
   });
 }

  changeToUppercase(){
    this.accentColor = this.accentColor.toUpperCase();
    this.bgColor = this.bgColor.toUpperCase();
    this.invoiceData.accentColor = this.accentColor;
    this.invoiceData.bgColor = this.bgColor;
    this.invoiceData.taxColor = this.taxColor;
    this.updateInvoice();
  }



  checkProduct(index){
    console.log('checking product',this.items[index]);
    if(!this.items[index]['_id']){
      this.items[index]['items'] = '';
      this.items[index]['description']='';
    }
  }

  addNewItem(i=1){
    let item:any={};
    item.title = 'Item';
    item.description = 'Description';
    item.units = 'Unit';
    item.quantity = i;
    item.price = 10;
    item.amount = 10;
    item.taxes = [];
    this.items.push(item);
  }

  updatePrice(index){
    if(this.items[index]['quantity'] < 0){
      this.items[index]['quantity'] = -(this.items[index]['quantity']);
      this.toastr.error("Quantity can not be negative");
    }
    this.items[index]['amount'] = this.items[index]['quantity'] * this.items[index]['price'];
    this.subTotal = this.items.reduce((pre,item)=>pre + item.amount,0);
    this.items[index]['taxes'].forEach(tax => {
      tax.amount = this.getTaxOnPrice(tax,this.items[index].amount);
    });
    this.taxCalculation();
  }

  getTaxOnPrice(tax,amount){
    let taxAmount = 0;
    if(tax.type=='percentage'){
      let singleTaxCount = amount * tax.value / 100;
      if(singleTaxCount > -1){
        taxAmount = singleTaxCount;
      }
    }
    if(tax.type=='flat'){
      if(tax.value > -1){
        taxAmount = tax.value;
      }
    }
    return taxAmount
  }

  deleteItem(index){
    console.log('deleteItem',index);
    this.items.splice(index,1);
    this.taxCalculation();
  }

  getAllTaxes(){
      this.filteredTaxes = this.invoiceData.taxes;
  }

  taxChangeEvent(event){
    if(event){
      let value = event.target.value;
      const reg = new RegExp(value, "i");
      this.filteredTaxes = this.invoiceData.taxes.filter(item=>reg.test(item.description) || reg.test(item.value) || reg.test(item.type))
    }else{
      this.filteredTaxes = this.invoiceData.taxes;
    }
  }

  onTaxSelect(tax,index){
    let taxModel:any={};
    taxModel.type = tax.type;
    taxModel.value = tax.value;
    taxModel.description = tax.description;
    taxModel.amount = 0;
    if(!this.items[index].taxes){
      this.items[index].taxes = [];
    }
    let findIndex = this.items[index].taxes.findIndex(e=>e.type == taxModel.type && e.value== taxModel.value && e.description== taxModel.description);
    if(findIndex > -1){
      console.log("Duplicate tax");
      this.toastr.error("Duplicate tax");
      return false;
    }
    this.items[index].taxes.push(taxModel);
    this.updatePrice(index);
    this.newTax = '';
    this.filteredTaxes = [];
    this.taxCalculation();
    return true;
  }

  removeTaxFromItem(index, taxIndex){
    console.log(this.items[index]['taxes'], taxIndex);
    this.items[index]['taxes'].splice(taxIndex,1);
    this.taxCalculation();
  }


  addEmail(email: any): void {
    const value = (email || '').trim();
    if(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value)){
      if (value) {
        this.emails.push({name: value});
        this.invoiceData.emailAddress = this.emails.map(item=>item.name);
      }
      this.newEmail='';
    }else{
      this.toastr.error("Email is incorrect")
    }

  }


  removeEmail(item){
    const index = this.emails.indexOf(item);
    if (index >= 0) {
      this.emails.splice(index, 1);
    }
    this.invoiceData.emailAddress = this.emails.map(item=>item.name);
  }

  
  drop(event: CdkDragDrop<string[]>): void {
    console.log('drop',event);
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
  }



  addNewTax(index){
      if(this.newTax){
        let newTax = JSON.parse(JSON.stringify(this.newTax));
        this.invoiceData.taxes.push(newTax);
        this.updateInvoice();
        if(index > -1){
          this.onTaxSelect(newTax,index);
          this.taxCalculation();
        }
        this.newTax = undefined;
      }
  }

  taxCalculation(){
    this.subTotal = this.items.reduce((pre,item)=>pre + item.amount,0);
    this.totalTax = 0;
    this.displayTaxes={};
    this.items.map(item=>{
      item.taxes.map(tax=>{
        let key = tax.description+' - '+tax.value+' '+(tax.type=='percentage'?'%':'');
        if(!this.displayTaxes[key]){
          let taxAmount =this.getTaxOnPrice(tax,item.amount);
          this.displayTaxes[key] = taxAmount;
          this.totalTax += taxAmount;
        }else{
          let taxAmount =this.getTaxOnPrice(tax,item.amount);
          this.displayTaxes[key] += taxAmount;
          this.totalTax += taxAmount;
        }
      });
    });
    this.subTotalAfterTax = this.subTotal + this.totalTax;
    // console.log(this.subTotalAfterTax , this.subTotal , this.totalTax);
    this.discountCalculation();
  }

  addNewDiscount(){
      let newDiscount:any = {};
      newDiscount.type = "percentage",
      newDiscount.description = "Discount";
      newDiscount.value = 2;
      this.discounts.push(newDiscount);
      this.discountCalculation();
  }

  discountCalculation(){
    // discunt will be count on subTotalAfterTax
    this.totalDiscount = 0;
    this.discounts = this.discounts.map(item=>{
      if(item.value < 0){
        item.value = -(item.value);
        this.toastr.error("Discount can not be in negative");
      }
      if(item.type=='percentage'){
        let singleDiscount = this.subTotalAfterTax * item.value / 100;
        if(singleDiscount > -1){
          item.total = singleDiscount;
          this.totalDiscount +=item.total;
        }
      }
      if(item.type=='flat'){
        if(item.value > -1){
          item.total = item.value;
          this.totalDiscount +=item.total;
        }
      }
      return item;
    });
    this.subTotalAfterDiscount = this.subTotalAfterTax - this.totalDiscount;
    this.subTotalAfterDiscount = Math.round(this.subTotalAfterDiscount * 100) / 100
    if(this.subTotalAfterDiscount < 0){
      this.subTotalAfterDiscount = 0;
    }
  }

  removeTax(index){
    this.invoiceData.taxes.splice(index,1);
    this.updateInvoice();
    this.taxCalculation();
  }

  removeDiscount(index){
    this.discounts.splice(index,1);
    this.discountCalculation();
  }

  openTaxForm(){
    this.newTax = {type:"percentage",description:"GST",value:5}
  }
  saveTax(){
    this.invoiceData.taxes.push(this.newTax);
  }
  changeTaxType(tax){
    tax.type == 'percentage' ? tax.type='flat' : tax.type = 'percentage';
  }

  selectIndex(index){
    this.index=index;
  }

  addNewSpace(){
    this.spaces.push({});
  }
  removeSpace(){
    this.spaces.splice(0);
  }

  updateInvoice(){
    localStorage.setItem('invoice',JSON.stringify(this.invoiceData));
  }

}
