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

## API Reference
Full details on API documentation and reference can be accessed [here](https://documenter.getpostman.com/view/6890514/Uz5NjDe6).

## Collaborators
Daniek Ozeh:
*Github*: [@danielozeh](https://github.com/danielozeh)
*Twitter*: [@danielozeh_](https://twitter.com/danielozeh_)