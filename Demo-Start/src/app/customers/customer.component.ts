import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn, FormArray } from '@angular/forms';

import { Customer } from './customer';
import { patchComponentDefWithScope } from '@angular/core/src/render3/jit/module';
import { debounceTime } from 'rxjs/operators';

function emailMatcher(c: AbstractControl): { [key: string]: boolean } | null {
  const emailControl = c.get('email');
  const confirmControl = c.get('confirmEmail');

  if (emailControl.pristine || confirmControl.pristine) {
    return null;
  }

  if (emailControl.value === confirmControl.value) {
    return null;
  }
  return { 'match': true };
}

function ratingRange(min: number, max: number): ValidatorFn {
  return (c: AbstractControl): { [key: string]: boolean } | null => {
    if (c.value !== null && (isNaN(c.value) || c.value < min || c.value > max)) {
      return { 'range': true };
    }
    return null;
  };
}


@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {
  customerForm: FormGroup;
  customer = new Customer();
  emailMessage: string;

  get addressesGroup(): FormArray {
    return <FormArray>this.customerForm.get('addressesGroup');
  }

  private validationMessages = {
    required: 'Please enter your email address.',
    email: 'Please enter a valid email address.'
  };

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.customerForm = this.fb.group({
      firstName: [null,
        [Validators.required,
        Validators.minLength(3)]
      ],
      lastName: [null,
        [Validators.required,
        Validators.maxLength(50)]
      ],
      emailGroup: this.fb.group({
        email: [null,
          [Validators.required,
          Validators.email]
        ],
        confirmEmail: [null, Validators.required],
      }, { validator: emailMatcher }),
      phone: null,
      notification: 'email',
      rating: [null, ratingRange(1, 5)],
      sendCatalog: true,
      addressesGroup: this.fb.array([this.buildAddressesGroup()])
    });

    this.customerForm.get('notification').valueChanges.subscribe(
      value => this.setNotification(value)
    );

    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(
      value => this.setMessage(emailControl)
    );
  }

  buildAddressesGroup(): FormGroup {
    return this.fb.group({
      addressType: 'home',
      street1: null,
      street2: null,
      city: null,
      state: null,
      zip: null
    });
  }

  addAddressGroup(): void {
    this.addressesGroup.push(this.buildAddressesGroup());
  }

  save() {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }

  populateTestData() {
    this.customerForm.setValue({
      firstName: 'Whatever',
      lastName: 'Thisis',
      email: 'wouldiuseit@hellno.com',
      sendCatalog: false
    });
  }

  setNotification(notifyVia: string): void {
    const phoneControl = this.customerForm.get('phone');
    if (notifyVia === 'text') {
      phoneControl.setValidators(Validators.required);
    } else {
      phoneControl.clearValidators();
    }
    phoneControl.updateValueAndValidity();
  }

  setMessage(c: AbstractControl): void {
    this.emailMessage = '';
    console.log(this.validationMessages);
    if ((c.touched || c.dirty) && c.errors) {
      this.emailMessage = Object.keys(c.errors).map(
        key => this.emailMessage += this.validationMessages[key]).join(' ');
    }
  }
}
