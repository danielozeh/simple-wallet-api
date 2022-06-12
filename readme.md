<h2> Simple Wallet API </h2>

<hr><hr>
<p> Author: Daniel Ozeh (hello@danielozeh.com.ng) </p>
<hr>

## Overview
Simple Wallet API is a JSON API built to perform basic fintech operations.

## Technology
API - Built on Node.js (Express JS) <br>
Database - NoSQL (MongoDB) <br>
Payment Platform - Paystack <br>

## Functionalities
This explains step by step on the functionalities of the project

***Authentication***

Sign Up: A user signs up using the following details:
1. Email
2. Password
3. Confirm Password
An email is triggered (sent to queue - RabbitMq) to the user to verify his/her account. Email containing OTP
<br>

Verify Email: User verifies email with otp sent

<br>

Login: user logins using the following
1. Email
2. Password

Other features in Authentication inludes
1. Resend email verification
2. Forgot Password
3. Reset Password

***User***

This module consist of 
1. Profile
2. Edit Profile
3. Find users (by first name, last name and email address)
4. Check if email exists

***Wallet***
1. Generate Transaction Reference - This generates a reference that will be passed on to the payment gateway
2. Payment Verification - After payment is successful, it is important to verify payment before passing value to customers (a webhook url is also included if this endpoint is not used)
3. Wallet History - Get all transactions performed (a filter option is also included) - Data is paginated at default to 25
4. Send Money - This allows users to send money to other users of the platform (note: a user can only only send to his/her beneficiary)
5. Wallet Info - Gets info of wallet (balance, cards)
6. Request Money - This allows a user request money from other users
7. Accept Money Request - When a request is sent to a user, this allows the user to approve the request
8. Decline Money Request - This feature allows a user to decline requests sent to him/her
9. Bank List - Displays the list of banks allowed
10. Withdraw Money - Allows a user make a withdrawal from wallet to his bank account (Paystack is used)
11. Add Beneficiary - Allows a user to add beneficiary 
12. Remove Beneficiary - Allows a user to remove added beneficiary
13. Transfer webhook - This endpoint checks if a transfer is successful and updates transaction status to successful, if it is failed, a reversal is done to the user, same goes to reversed transactions (this uses Paystack)


## API Reference
Full details on API documentation and reference can be accessed [here](https://documenter.getpostman.com/view/6890514/Uz5NjDe6).

## Collaborators
Daniek Ozeh:
*Github*: [@danielozeh](https://github.com/danielozeh)
*Twitter*: [@danielozeh_](https://twitter.com/danielozeh_)