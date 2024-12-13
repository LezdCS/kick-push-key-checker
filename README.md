# Kick.com Pusher Config Extractor

A tool for automatically extracting Pusher configuration from Kick.com and
updating Firebase Remote Config.

## Purpose

This tool helps maintain up-to-date Pusher configuration for Kick.com by:

1. Automatically scraping Kick.com to extract their Pusher app key and cluster
   information
2. Updating Firebase Remote Config with the latest values
3. Enabling automated monitoring of Kick.com's WebSocket configuration changes

## Features

- Automated scraping of Kick.com using stealth browser automation
- WebSocket connection monitoring to capture Pusher configuration
- Firebase Remote Config integration for configuration management
- Built with TypeScript and Deno for modern, type-safe development

## Prerequisites

- Deno runtime
- Firebase project with Remote Config enabled
- Environment variables configured (see `.env.sample`):
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
  - `FIREBASE_PROJECT_ID`
  - `REMOTE_CONFIG_KEY`

## Setup

1. Clone the repository
2. Copy `.env.sample` to `.env` and configure your Firebase credentials
3. Run development server:
