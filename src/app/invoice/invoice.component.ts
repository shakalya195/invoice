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
      html2canvas(this.printmedia.nativeElement,{
        allowTaint: true,
        useCORS: true
      }).then(canvas=>{
        const imgData = canvas.toDataURL('image/jpeg');
        // console.log('imgData',imgData);
        // document.getElementsByClassName('cccc')[0].append(canvas);
        const pdf = new jsPDF({
          orientation:'portrait'
        });
        const imageProps = pdf.getImageProperties(imgData)
        const pdfw = pdf.internal.pageSize.getWidth()
        const pdfh = (imageProps.height * pdfw) / imageProps.width
        pdf.addImage(imgData, 'PNG', 0, 0, pdfw, pdfh)
        pdf.save("invoice-"+Date.now()+".pdf");
        this.previewClear();
      });
    },1000);

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

  addNewItem(){
    let item:any={};
    item.title = 'Item';
    item.description = 'Item Description';
    item.units = 'Unit';
    item.quantity = 1;
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
